import requests
from flask import current_app
from app import cache
class TMDBService:
    """Encapsulates all TMDB API interactions with caching and error handling."""
  def _get(self, endpoint: str, params: dict = None) -> dict:
    """
    Why log here?
    Every TMDB call costs time and counts against your API rate limit.
    Logging each call lets you spot if something is calling the API
    too many times or if TMDB is slow/down.
    """
    base_url = current_app.config["TMDB_BASE_URL"]
    api_key = current_app.config["TMDB_API_KEY"]
    url = f"{base_url}{endpoint}"
    merged_params = {"api_key": api_key, **(params or {})}
    logger.info(f"TMDB request: {endpoint}")
    try:
        response = requests.get(url, params=merged_params, timeout=8)
        response.raise_for_status()
        logger.info(f"TMDB response: {response.status_code} for {endpoint}")
        return response.json()
    except requests.Timeout:
        logger.error(f"TMDB timeout for {endpoint}")
        raise TMDBError("TMDB request timed out.")
    except requests.HTTPError as e:
        logger.error(f"TMDB HTTP error {e.response.status_code} for {endpoint}")
        raise TMDBError(f"TMDB HTTP error: {e.response.status_code}")
    except requests.RequestException as e:
        logger.error(f"TMDB connection error for {endpoint}: {str(e)}")
        raise TMDBError(f"TMDB connection error: {str(e)}")
    def search_movie(self, title: str) -> list[dict]:
        data = self._get("/search/movie", {"query": title})
        return data.get("results", [])
    def get_mpaa_rating(self, movie_id: int) -> str:
        data = self._get(f"/movie/{movie_id}/release_dates")
        for result in data.get("results", []):
            if result["iso_3166_1"] == "US":
                for release in result.get("release_dates", []):
                    cert = release.get("certification", "").strip()
                    if cert:
                        return cert
        return "NR"
    def get_streaming_providers(self, movie_id: int) -> list[str]:
        data = self._get(f"/movie/{movie_id}/watch/providers")
        us = data.get("results", {}).get("US", {})
        providers = us.get("flatrate", [])
        return [p["provider_name"] for p in providers]
    @cache.cached(timeout=86400, key_prefix="tmdb_genres")
    def get_genre_map(self) -> dict[int, str]:
        data = self._get("/genre/movie/list")
        return {g["id"]: g["name"] for g in data.get("genres", [])}
    def resolve_genres(self, genre_ids: list[int]) -> str:
        genre_map = self.get_genre_map()
        return ", ".join(genre_map.get(gid, "Unknown") for gid in genre_ids)
    def fetch_full_movie(self, tmdb_result: dict) -> dict:
        """Build a clean dict from a TMDB search result."""
        movie_id = tmdb_result["id"]
        release_date = tmdb_result.get("release_date", "")
        release_year = int(release_date.split("-")[0]) if release_date else None
        return {
            "tmdb_id": movie_id,
            "title": tmdb_result["title"],
            "genre": self.resolve_genres(tmdb_result.get("genre_ids", [])),
            "rating": self.get_mpaa_rating(movie_id),
            "release_year": release_year,
            "overview": tmdb_result.get("overview", ""),
            "poster_path": tmdb_result.get("poster_path", ""),
            "streaming_providers": self.get_streaming_providers(movie_id),
        }
class TMDBError(Exception):
    """Raised when TMDB API calls fail."""
    pass
tmdb = TMDBService()

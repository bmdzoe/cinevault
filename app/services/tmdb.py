import logging
import requests
from flask import current_app
from app import cache
logger = logging.getLogger(__name__)
class TMDBService:
    def _get(self, endpoint: str, params: dict = None) -> dict:
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
    def get_trailers(self, movie_id: int) -> list[dict]:
        data = self._get(f"/movie/{movie_id}/videos")
        videos = data.get("results", [])
        trailers = [
            {"name": v["name"], "key": v["key"]}
            for v in videos
            if v["site"] == "YouTube" and v["type"] == "Trailer"
        ]
        if not trailers:
            trailers = [
                {"name": v["name"], "key": v["key"]}
                for v in videos
                if v["site"] == "YouTube"
            ]
        return trailers[:3]
    @cache.cached(timeout=86400, key_prefix="tmdb_genres")
    def get_recommendations(self, movie_id: int) -> list[dict]:
        data = self._get(f"/movie/{movie_id}/recommendations")
        results = data.get("results", [])
        recommendations = []
        for r in results[:6]:
            release_date = r.get("release_date", "")
            release_year = int(release_date.split("-")[0]) if release_date else None
            recommendations.append({
                "tmdb_id": r["id"],
                "title": r["title"],
                "poster_path": r.get("poster_path", ""),
                "poster_url": f"https://image.tmdb.org/t/p/w200{r['poster_path']}" if r.get("poster_path") else None,
                "release_year": release_year,
                "overview": r.get("overview", ""),
            })
        return recommendations
        def get_popular(self) -> list[dict]:
        """Top movies people are watching right now."""
        data = self._get("/movie/popular")
        return self._format_list(data.get("results", [])[:18])
    def get_top_rated(self) -> list[dict]:
        """Highest rated movies of all time on TMDB."""
        data = self._get("/movie/top_rated")
        return self._format_list(data.get("results", [])[:18])
    def get_now_playing(self) -> list[dict]:
        """Movies currently in theaters."""
        data = self._get("/movie/now_playing")
        return self._format_list(data.get("results", [])[:18])
    def get_upcoming(self) -> list[dict]:
        """Movies coming soon to theaters."""
        data = self._get("/movie/upcoming")
        return self._format_list(data.get("results", [])[:18])
    def _format_list(self, results: list) -> list[dict]:
        formatted = []
        for r in results:
            release_date = r.get("release_date", "")
            release_year = int(release_date.split("-")[0]) if release_date else None
            formatted.append({
                "tmdb_id": r["id"],
                "title": r["title"],
                "poster_path": r.get("poster_path", ""),
                "poster_url": f"https://image.tmdb.org/t/p/w342{r['poster_path']}" if r.get("poster_path") else None,
                "release_year": release_year,
                "overview": r.get("overview", ""),
                "rating": r.get("vote_average", 0),
            })
        return formatted
    def get_genre_map(self) -> dict[int, str]:
        data = self._get("/genre/movie/list")
        return {g["id"]: g["name"] for g in data.get("genres", [])}
    def resolve_genres(self, genre_ids: list[int]) -> str:
        genre_map = self.get_genre_map()
        return ", ".join(genre_map.get(gid, "Unknown") for gid in genre_ids)
    def fetch_full_movie(self, tmdb_result: dict) -> dict:
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
    pass
tmdb = TMDBService()

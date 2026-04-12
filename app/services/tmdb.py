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
                    cert = release.get("certification", "").strip
    pass
tmdb = TMDBService()

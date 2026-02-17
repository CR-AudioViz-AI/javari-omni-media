import axios from 'axios'

const TMDB_API_KEY = process.env.TMDB_API_KEY || ''
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export interface TMDBMovie {
  id: number
  title: string
  original_title: string
  release_date: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  genres: { id: number; name: string }[]
  runtime: number
  tagline: string
}

export interface TMDBTVShow {
  id: number
  name: string
  original_name: string
  first_air_date: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  genres: { id: number; name: string }[]
  number_of_seasons: number
  number_of_episodes: number
}

/**
 * Search for a movie on TMDB
 */
export async function searchMovie(title: string, year?: number): Promise<TMDBMovie | null> {
  if (!TMDB_API_KEY) {
    console.warn('TMDB API key not configured')
    return null
  }

  try {
    const params: any = {
      api_key: TMDB_API_KEY,
      query: title,
      language: 'en-US'
    }
    
    if (year) {
      params.year = year
    }
    
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, { params })
    
    if (response.data.results && response.data.results.length > 0) {
      const movieId = response.data.results[0].id
      return getMovieDetails(movieId)
    }
    
    return null
  } catch (error) {
    console.error('Error searching movie on TMDB:', error)
    return null
  }
}

/**
 * Get detailed movie information
 */
export async function getMovieDetails(movieId: number): Promise<TMDBMovie | null> {
  if (!TMDB_API_KEY) {
    return null
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US'
      }
    })
    
    return response.data
  } catch (error) {
    console.error('Error getting movie details from TMDB:', error)
    return null
  }
}

/**
 * Search for a TV show on TMDB
 */
export async function searchTVShow(title: string, year?: number): Promise<TMDBTVShow | null> {
  if (!TMDB_API_KEY) {
    console.warn('TMDB API key not configured')
    return null
  }

  try {
    const params: any = {
      api_key: TMDB_API_KEY,
      query: title,
      language: 'en-US'
    }
    
    if (year) {
      params.first_air_date_year = year
    }
    
    const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, { params })
    
    if (response.data.results && response.data.results.length > 0) {
      const tvId = response.data.results[0].id
      return getTVShowDetails(tvId)
    }
    
    return null
  } catch (error) {
    console.error('Error searching TV show on TMDB:', error)
    return null
  }
}

/**
 * Get detailed TV show information
 */
export async function getTVShowDetails(tvId: number): Promise<TMDBTVShow | null> {
  if (!TMDB_API_KEY) {
    return null
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tvId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US'
      }
    })
    
    return response.data
  } catch (error) {
    console.error('Error getting TV show details from TMDB:', error)
    return null
  }
}

/**
 * Get image URL from TMDB path
 */
export function getTMDBImageUrl(path: string | null, size: 'w200' | 'w500' | 'original' = 'w500'): string | null {
  if (!path) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}

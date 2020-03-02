import React, { useState, useEffect } from 'react'
import { Button, Alert } from 'react-bootstrap'
import { Link, useHistory } from 'react-router-dom'
import restaurantService from '../../../services/restaurant'
import authService from '../../../services/authentication'
import suggestionService from '../../../services/suggestion'
import List from '../../List/List'
import ListEntry from '../../List/ListEntry'

import './RestaurantList.css'

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState()
  const history = useHistory()

  const token = authService.getToken()
  const isLoggedIn = token !== undefined

  useEffect(() => {
    restaurantService.getAll().then(setRestaurants)
  }, [])

  const removeRestaurant = async (restaurant) => {
    if (isLoggedIn) {
      if (!window.confirm(`Are you sure you want to remove "${restaurant.name}"?`)) {
        return
      }

      const result = await restaurantService.remove(restaurant.id)
      if (result && result.status === 204) {
        setRestaurants(restaurants.filter(r => r.id !== restaurant.id))
      }
    } else {
      if (window.confirm(`Suggest the removal of ${restaurant.name}?`)) {
        await suggestionService.removeRestaurant(restaurant)
      }
    }
  }

  const editRestaurant = (restaurant) => {
    history.push(`/edit/${restaurant.id}`)
  }

  return (
    <div data-testid='restaurantList' className="restaurantList">
      <Link to='/' className="restaurantList-backButton"><Button data-testid='restaurantList-backButton'>Back</Button></Link>
      <h1 data-testid='restaurantList-title' className='restaurantList-title'>Restaurants</h1>
      <List
        entries={restaurants}
        renderNoEntries={() => <Alert variant='warning'>Sorry, No restaurants available :C</Alert>}
        renderEntry={(restaurant) =>
          <ListEntry
            key={restaurant.id}
            item={restaurant}
            onClickRemove={removeRestaurant}
            onClickEdit={isLoggedIn ? editRestaurant : undefined}
          />
        }
      />
    </div>
  )
}

export default RestaurantList
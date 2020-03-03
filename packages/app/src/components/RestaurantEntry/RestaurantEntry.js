import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types'

const RestaurantEntry = ({ restaurant }) => {

  const confirmLeave = (event) => {
    if (!window.confirm(`This URL is user-submitted content that leads to an external website. 
    Are you sure you want to leave? URL: ${restaurant.url}`)) {
      event.preventDefault()
    }
  }

  const processUrl = (url) => {
    const hasPrefix = url.startsWith('https://') || url.startsWith('http://') || url.startsWith('//')
    return hasPrefix ? url : `//${url}`
  }

  return (
    <>
      <h1 data-testid='randomizer-resultLabel'>{restaurant.name}</h1>
      {restaurant.url &&
        <p>
          <a data-testid='randomizer-restaurantUrl'
            className='restaurant-url'
            onClick={(event) => confirmLeave(event)}
            href={processUrl(restaurant.url)}
            target='_blank'
            rel='noopener noreferrer'>
            <span>Website </span>
            <FontAwesomeIcon icon={faExternalLinkAlt} />
          </a>
        </p>
      }
    </>

  )
}

RestaurantEntry.propTypes = {
  restaurant: PropTypes.object.isRequired
}

export default RestaurantEntry
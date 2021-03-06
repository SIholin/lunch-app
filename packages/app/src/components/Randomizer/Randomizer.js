import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Button } from 'react-bootstrap'
import { ExpandMore, ExpandLess, ThumbUpAlt, ThumbDownAlt } from '@material-ui/icons'

import RestaurantEntry from '../RestaurantEntry/RestaurantEntry'
import Filter from '../Filter/Filter/Filter'
import Confetti from '../p5Components/Confetti/Confetti'
import FoodModel from '../p5Components/FoodModel/FoodModel'

import { useNopeEasterEgg } from './nopeEasterEgg'
import { shuffle } from '../../util/shuffle'

import soundService from '../../services/sound'
import restaurantService from '../../services/restaurant'

import './Randomizer.css'

const easingFunc = (max, min, t) => {
  return (max - min) * Math.pow(t, 4) + min
}

const Randomizer = ({
  maxNumberOfRolls = 35,
  minTimeBetweenRolls = 25,
  maxTimeBetweenRolls = 1000,
  resultWaitTime = 1250
}) => {
  const [restaurant, setRestaurant] = useState()
  const selectedRestaurant = useRef()
  const rollsRemaining = useRef()
  const shouldLoad = useRef()
  const [iteration, setIteration] = useState(maxNumberOfRolls)
  const [isRolling, setRolling] = useState(false)
  const [resultSelected, setResultSelected] = useState(false)

  const [filter, setFilter] = useState({
    type: 'some',
    categories: [],
    distance: '',
    visible: false
  })

  const [timeoutHandle, setTimeoutHandle] = useState()
  useEffect(() => () => clearTimeout(timeoutHandle), [timeoutHandle])

  const rollAfterTimeout = (roll, timeout, restaurants) => {
    soundService.playBeep()

    const handle = setTimeout(() => rollNext(roll, restaurants), timeout)
    setTimeoutHandle(handle)
  }

  const nope = useNopeEasterEgg(rollAfterTimeout, {
    triggerChance: 0.025,
    numberOfRolls: Math.ceil(maxNumberOfRolls / 2)
  })

  const setError = (error) => {
    setRestaurant({ error: error })
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
      setTimeoutHandle()
    }
  }

  const calculateTimeForNthRoll = (n) => {
    const t = n / maxNumberOfRolls
    const time = easingFunc(maxTimeBetweenRolls, minTimeBetweenRolls, t)

    return n === maxNumberOfRolls - 1
      ? time + resultWaitTime
      : time
  }

  const handleApproveResult = async () => {
    if (selectedRestaurant.current && selectedRestaurant.current.id) {
      selectedRestaurant.current = ({ ...selectedRestaurant.current, selectedAmount: selectedRestaurant.current.selectedAmount + 1 })
      restaurantService.increaseSelectedAmount(selectedRestaurant.current.id)
    }
    setResultSelected(true)
  }

  const startRolling = async () => {
    shouldLoad.current = false
    rollsRemaining.current = maxNumberOfRolls
    if (selectedRestaurant.current && selectedRestaurant.current.id) {
      await restaurantService.increaseNotSelectedAmount(selectedRestaurant.current.id)
    }
    let restaurants = await restaurantService.getAllMatches(filter.type, filter.categories, filter.distance)
    restaurants = shuffle(restaurants)
    selectedRestaurant.current = restaurants[maxNumberOfRolls % restaurants.length]

    if (restaurants.length === 1) {
      shouldLoad.current = true
      setRestaurant(selectedRestaurant.current)
      filter.visible && setFilter({ ...filter, visible: false })
      soundService.playFanfare()
      await restaurantService.increaseResultAmount(selectedRestaurant.current.id)
    } else {
      setRolling(true)
      filter.visible && setFilter({ ...filter, visible: false })
      rollAfterTimeout(0, maxTimeBetweenRolls, restaurants)
    }
  }


  const rollNext = async (roll, restaurants) => {
    setRestaurant(restaurants[roll % restaurants.length])
    rollsRemaining.current = maxNumberOfRolls - roll

    const easterEggDidTrigger = nope.updateAndTryTrigger(restaurants, rollsRemaining.current)
    if (easterEggDidTrigger) {
      return
    }

    setIteration(roll)
    if (rollsRemaining.current < 5) {
      shouldLoad.current = true
    }
    if (rollsRemaining.current === 0) {
      soundService.playFanfare()
      setTimeoutHandle(undefined)
      setRolling(false)
      await restaurantService.increaseResultAmount(selectedRestaurant.current.id)
    } else {
      const timeout = calculateTimeForNthRoll(roll)
      rollAfterTimeout(roll + 1, timeout, restaurants)
    }
  }

  const selectRestaurantElement = () => {
    if (restaurant && restaurant.error) {
      return <h1 data-testid='randomizer-resultLabel'>{restaurant.error}</h1>
    }

    const hasRestaurant = !!restaurant
    return hasRestaurant ?
      <>
        {isRolling && <h1 data-testid='roll-label' className="roll-label">{restaurant.name}</h1>}
        {!isRolling && <Confetti />}
        {resultSelected && <h1>No backing down now! You&apos;re having lunch at:</h1>}
        {shouldLoad.current && <RestaurantEntry hidden={isRolling} restaurant={selectedRestaurant.current} />}
      </>
      : <h1 data-testid='randomizer-resultLabel' className='roll-label'>Hungry? Press the button!</h1>
  }

  rollsRemaining.current = maxNumberOfRolls - iteration
  const isPicky = filter.categories.length > 0
  return (
    <div data-testid='randomizer' className='randomizer'>
      {nope.active && <h1>NOPE</h1>}

      <div data-testid='foodmodel-container' className='foodmodel' style={{ display: `${(restaurant && !isRolling) ? 'none' : 'inline'}` }}>
        <FoodModel rolling={isRolling} rollsRemaining={rollsRemaining.current} />
      </div>
      {!resultSelected &&
        <div className="randomizer-button-group">
          <RandomizerButton
            onClick={startRolling}
            setError={setError}
            isPicky={isPicky}
            isRolling={isRolling}
            hasResult={restaurant !== undefined && !isRolling}
            maxNumberOfRolls={maxNumberOfRolls}
            rollsRemaining={rollsRemaining.current}
          />
          {(!isRolling && !!restaurant) &&
            <Button
              data-testid='randomizer-approveButton'
              className='randomizer-button flex'
              onClick={handleApproveResult}
              variant='success'>
              <span>
                <ThumbUpAlt /> Ok, I&apos;m picking this one!
              </span>
            </Button>
          }
        </div>
      }
      {!resultSelected &&
        <>
          <Button
            className='randomizer-showFilterButton'
            disabled={isRolling}
            variant='info'
            onClick={() => setFilter({ ...filter, visible: !filter.visible })}>
            {filter.visible ? 'Hide filter ' : 'Set filter '}
            {filter.visible ? <ExpandLess /> : <ExpandMore />}
          </Button>
          <Filter
            emptyMessage={<strong>#IEatAnything</strong>}
            filterCategories={filter.categories}
            setFilterCategories={(value) => setFilter({ ...filter, categories: value })}
            filterType={filter.type}
            setFilterType={(value) => setFilter({ ...filter, type: value })}
            distance={filter.distance}
            setDistance={(value) => setFilter({ ...filter, distance: value })}
            showFilter={filter.visible}
          />
        </>
      }
      {selectRestaurantElement()}
    </div>
  )
}

const RandomizerButton = ({
  onClick,
  setError,
  isRolling,
  isPicky,
  hasResult,
  rollsRemaining,
  maxNumberOfRolls
}) => {
  const handleClick = async (event) => {
    event.preventDefault()
    try {
      await onClick()
    } catch (errorResponse) {
      errorResponse.response
        ? setError(errorResponse.response.data.error)
        : setError(errorResponse)

      soundService.playTrombone()
    }
  }

  const label = isRolling
    ? rollsRemaining > maxNumberOfRolls / 3
      ? 'Rolling!'
      : 'Wait for it...'
    : hasResult
      ? <span><ThumbDownAlt /> Nope, gimme another one!</span>
      : `I'm feeling ${isPicky ? 'picky' : 'lucky'}!`

  return (
    <Button
      className={hasResult ? 'flex randomizer-button' : 'randomizer-button'}
      data-testid='randomizer-randomizeButton'
      onClick={handleClick}
      variant={hasResult ? 'secondary' : 'success'}
      size={!hasResult && 'lg'}
      disabled={isRolling}>
      {label}
    </Button>
  )
}

RandomizerButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  isRolling: PropTypes.bool.isRequired,
  isPicky: PropTypes.bool.isRequired,
  hasResult: PropTypes.bool.isRequired,
  rollsRemaining: PropTypes.number,
  maxNumberOfRolls: PropTypes.number,
}

Randomizer.propTypes = {
  maxNumberOfRolls: PropTypes.number,
  minTimeBetweenRolls: PropTypes.number,
  maxTimeBetweenRolls: PropTypes.number,
  resultWaitTime: PropTypes.number,
}

export default Randomizer

import React from 'react'
import { render, fireEvent, waitForDomChange, waitForElementToBeRemoved } from '@testing-library/react'
import AddForm from './AddForm'
import RestaurantEntry from './RestaurantEntry'
import restaurantService from '../services/restaurant'
import App from '../App'
import { MemoryRouter } from 'react-router-dom'
import { act } from 'react-dom/test-utils'

jest.mock('../services/restaurant.js')

beforeEach(() => {
  jest.clearAllMocks()
})

test('invalid input displays an error message', async () => {
  const { queryByTestId } = render(
    <MemoryRouter initialEntries={['/add']}>
      <AddForm restaurantService={restaurantService} />
    </MemoryRouter>
  )

  const buttonElement = await queryByTestId('addForm-addButton')
  fireEvent.click(buttonElement)

  const error = await queryByTestId('addForm-errorMessage')
  expect(error).toBeInTheDocument()
})

test('add button calls restaurantservice', async () => {
  await act(async () => {
    const { queryByTestId } = render(
      <MemoryRouter initialEntries={['/add']}>
        <AddForm restaurantService={restaurantService} />
      </MemoryRouter>
    )

    // Input test data
    const nameElement = await queryByTestId('addForm-nameField')
    fireEvent.change(nameElement, { target: { value: 'Lidl City Center' } })
    const urlElement = await queryByTestId('addForm-urlField')
    fireEvent.change(urlElement, { target: { value: 'https://www.lidl.fi/' } })

    // Test that the restaurant service is called
    const buttonElement = await queryByTestId('addForm-addButton')
    fireEvent.click(buttonElement)

    expect(restaurantService.add).toBeCalled()
  })
})

test('form is closed after adding a restaurant', async () => {
  const { queryByTestId, getByTestId } = render(
    <MemoryRouter initialEntries={['/add']}>
      <App restaurantService={restaurantService} />
    </MemoryRouter>
  )

  // Input test data
  const nameElement = queryByTestId('addForm-nameField')
  fireEvent.change(nameElement, { target: { value: 'Lidl City Center' } })
  const urlElement = queryByTestId('addForm-urlField')
  fireEvent.change(urlElement, { target: { value: 'https://www.lidl.fi/' } })

  const buttonElement = queryByTestId('addForm-addButton')
  fireEvent.click(buttonElement)

  await waitForElementToBeRemoved(() => getByTestId('addForm'), { timeout: 250 })
})

test('pressing cancel hides the component', () => {
  const { queryByTestId } = render(
    <MemoryRouter initialEntries={['/add']}>
      <App restaurantService={restaurantService} />
    </MemoryRouter>
  )

  // Hide the form
  const buttonElement = queryByTestId('addForm-cancelButton')
  fireEvent.click(buttonElement)

  const form = queryByTestId('addForm')
  expect(form).not.toBeInTheDocument()
})

test('form is empty if restaurant is not found with the given id parameter', () => {
  const { queryByTestId } = render(
    <MemoryRouter initialEntries={['/edit/1']}>
      <AddForm restaurantService={restaurantService} />
    </MemoryRouter>
  )

  const nameField = queryByTestId('addForm-nameField')
  expect(nameField.value).toBe('')
})

test('form is pre-filled if a restaurant is found with the given id parameter', async () => {
  restaurantService.getOneById.mockResolvedValue(
    {
      name: 'Luigi\'s pizza',
      url: 'www.pizza.fi',
      id: 1
    }
  )

  let queryByTestId
  await act(async () => {
    const renderResult = render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <AddForm restaurantService={restaurantService} />
      </MemoryRouter>
    )
    queryByTestId = renderResult.queryByTestId
  })

  //await waitForDomChange()
  const nameField = await queryByTestId('addForm-nameField')
  expect(nameField.value).toBe('Luigi\'s pizza')
})

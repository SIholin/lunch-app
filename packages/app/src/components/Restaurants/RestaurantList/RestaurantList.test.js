import React from 'react'
import { fireEvent, within, wait } from '@testing-library/react'
import restaurantService from '../../../services/restaurant'
import categoryService from '../../../services/category'
import authService from '../../../services/authentication'

import RestaurantList from './RestaurantList'

import { actRender } from '../../../test/utilities'

jest.mock('../../../services/restaurant.js')
jest.mock('../../../services/category.js')
jest.mock('../../../services/suggestion.js')
jest.mock('../../../services/authentication.js')

beforeEach(() => {
  jest.clearAllMocks()
  categoryService.getAll.mockResolvedValue([{ id: 3, name: 'salads' }])
  restaurantService.getAll.mockResolvedValue(
    [
      {
        name: 'Luigi\'s pizza',
        url: 'www.pizza.fi',
        id: 1
      },
      {
        name: 'Pizzeria Rax',
        url: 'www.rax.fi',
        id: 2
      },
      {
        name: 'Ravintola Artjärvi',
        url: 'www.bestfood.fi',
        id: 3
      }
    ]
  )
})

test('page title is rendered', async () => {
  const { queryByTestId } = await actRender(<RestaurantList />, ['/restaurants'])
  const title = await queryByTestId('restaurantList-title')
  expect(title).toBeInTheDocument()
})

test('pressing the delete button calls the service to remove the restaurant if OK is pressed', async () => {
  authService.getToken.mockReturnValue('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlNDUzYmFlNjZiYjNkMjUxZGMwM2U5YyIsInVzZXJuYW1lIjoiTWFrZSIsImlhdCI6MTU4MTU5OTg5MX0.0BDsns4hxWvMguZq8llaB3gMTvPNDkDhPkl7mCYl928')

  restaurantService.getAll.mockResolvedValue([{
    name: 'Luigi\'s pizza',
    url: 'www.pizza.fi',
    id: 13
  }])

  window.confirm = jest.fn(() => true)

  const { getByTestId } = await actRender(<RestaurantList />, ['/restaurants'])

  const entry = within(getByTestId('list')).getByTestId('list-entry')
  const removeButton = within(entry).getByRole('remove-button')
  fireEvent.click(removeButton)
  expect(restaurantService.remove).toBeCalledWith(13)
})

test('pressing the delete button does not attempt to remove the restaurant if cancel is pressed', async () => {
  authService.getToken.mockReturnValue('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlNDUzYmFlNjZiYjNkMjUxZGMwM2U5YyIsInVzZXJuYW1lIjoiTWFrZSIsImlhdCI6MTU4MTU5OTg5MX0.0BDsns4hxWvMguZq8llaB3gMTvPNDkDhPkl7mCYl928')

  restaurantService.getAll.mockResolvedValue([{
    name: 'Luigi\'s pizza',
    url: 'www.pizza.fi',
    id: 13
  }])

  window.confirm = jest.fn(() => false)

  const { getByTestId } = await actRender(<RestaurantList />, ['/restaurants'])

  const entry = within(getByTestId('list')).getByTestId('list-entry')
  const removeButton = within(entry).getByRole('remove-button')
  fireEvent.click(removeButton)
  expect(restaurantService.remove).not.toBeCalled()
})

test('pressing the edit button redirects to edit page', async () => {
  restaurantService.getAll.mockResolvedValue([{
    name: 'Luigi\'s pizza',
    url: 'www.pizza.fi',
    id: 13
  }])

  const { getByTestId, getPath } = await actRender(<RestaurantList />, ['/restaurants'])

  const entry = within(getByTestId('list')).getByTestId('list-entry')
  const removeButton = within(entry).getByRole('edit-button')
  fireEvent.click(removeButton)
  await wait(() => expect(getPath().pathname).toBe('/edit/13'), { timeout: 500 })
})

test('search field renders', async () => {
  const { queryByTestId } = await actRender(<RestaurantList />, ['/restaurants'])
  const field = await queryByTestId('search-field')
  expect(field).toBeInTheDocument()
})

test('text can be entered to the search field', async () => {
  const { queryByTestId } = await actRender(<RestaurantList />, ['/restaurants'])
  const field = await queryByTestId('search-field')
  const input = within(field).getByTestId('input-field')
  fireEvent.change(input, { target: { value: 'zz' } })
  expect(input.value).toBe('zz')
})

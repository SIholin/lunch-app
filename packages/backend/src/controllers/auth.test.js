const supertest = require('supertest')
const app = require('../app')
const dbUtil = require('../test/dbUtil')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const config = require('../config')
const authorization = require('../util/authorization')

const userData = [
  {
    username: 'jaskajoku',
    password: 'kissa',
  }
]

let server, users, user, token
beforeEach(async () => {
  dbUtil.connect()
  server = supertest(app)

  const processedUsers = []
  for (const user of userData) {
    processedUsers.push(await dbUtil.createUser(user.username, user.password))
  }

  users = await dbUtil.createRowsFrom(User, processedUsers)

  user = await dbUtil.createUser('admintestuser', 'kissakoira123')
  token = authorization.createToken(user._id, user.username)
})

afterEach(async () => {
  await dbUtil.cleanupAndDisconnect()
})

test('post request to login with valid data returns http code 200', async () => {
  await server
    .post('/api/auth/login')
    .send({ username: 'jaskajoku', password: 'kissa' })
    .expect(200)
})

test('post request to login with valid data returns a token', async () => {
  const { body } = await server
    .post('/api/auth/login')
    .send({ username: 'jaskajoku', password: 'kissa' })

  expect(body.token).toBeDefined()
})

test('token returned from login request contains valid user info', async () => {
  const { body } = await server
    .post('/api/auth/login')
    .send({ username: 'jaskajoku', password: 'kissa' })
  const decodedToken = jwt.verify(body.token, config.jwtSecret)
  const id = users[0].id

  expect(decodedToken).toMatchObject({
    username: 'jaskajoku',
    id
  })
})

test('post request to login with invalid data returns http code 403', async () => {
  await server
    .post('/api/auth/login')
    .send({ username: '', password: 'koira' })
    .expect(403)
})

describe('when logged in', () => {
  test('post request to users with valid data returns http code 201', async () => {
    await server
      .post('/api/auth/users')
      .set('authorization', `bearer ${token}`)
      .send({ username: 'newuser', password: 'koirakissakoira' })
      .expect(201)
  })

  test('post request to users with valid data returns user object', async () => {
    const response = await server
      .post('/api/auth/users')
      .set('authorization', `bearer ${token}`)
      .send({ username: 'newuser', password: 'koirakissakoira' })

    expect(response.body).toMatchObject({ username: 'newuser', id: expect.anything() })
  })

  test('get request to users returns all users', async () => {
    const response = await server
      .get('/api/auth/users')
      .set('authorization', `bearer ${token}`)

    expect(response.body).toHaveLength(2)
  })

  test('trying to change password for other user fails with 403', async () => {
    const newPassword = 'hähähäää'
    await server
      .post(`/api/auth/users/${users[0].id}/password`)
      .set('authorization', `bearer ${token}`)
      .send({ password: users[0].id, newPassword })
      .expect(403)
  })

  test('trying to change password fails with 403 when current password is wrong', async () => {
    const newPassword = 'hähähäää'
    await server
      .post(`/api/auth/users/${user.id}/password`)
      .set('authorization', `bearer ${token}`)
      .send({ password: 'väärä salasana', newPassword })
      .expect(403)
  })

  test('trying to change password succeeds with 200 when credentials are correct', async () => {
    const newPassword = 'koirakissa321'
    await server
      .post(`/api/auth/users/${user._id}/password`)
      .set('authorization', `bearer ${token}`)
      .send({ password: 'kissakoira123', newPassword })
      .expect(200)
  })

  test('new password can be used to log in after succesfull password update', async () => {
    const newPassword = 'koirakissa321'
    await server
      .post(`/api/auth/users/${user._id}/password`)
      .set('authorization', `bearer ${token}`)
      .send({ password: 'kissakoira123', newPassword })

    await server
      .post('/api/auth/login')
      .send({ username: user.username, password: newPassword })
      .expect(200)
  })
})

describe('when not logged in', () => {
  test('post request to users returns http code 403', async () => {
    await server
      .post('/api/auth/users')
      .send({ username: 'newuser', password: 'koirakissakoira' })
      .expect(403)
  })

  test('get request to users returns http code 403', async () => {
    await server
      .get('/api/auth/users')
      .expect(403)
  })

  test('trying to change password fails with 403', async () => {
    await server
      .post(`/api/auth/users/${user.id}/password`)
      .send({ password: 'kissakoira123', newPassword: 'koirakissa321' })
      .expect(403)
  })
})

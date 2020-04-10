require('dotenv').config()
const WebSocket = require('ws');
const crypto = require('crypto')

class Framer {
  validMessageTypes = [
    'request',
    'subscribe-to event',
    'unsubscribe-from event'
  ]

  constructor(
    messageType,
    sequenceNumber,
    functionName,
    payload
  ) {
    if (!this.validMessageTypes.some((check, i) => {
      if  (messageType === check) {
        this.m = i*2
        this.i = sequenceNumber
        this.n = functionName
        this.o = JSON.stringify(payload)
        return true
      }
      return false
    })) {
      console.error(`invalid message Type ${messageType}`)
      throw 'invalide messageType'
    }
  }

  frame = () => {
    return JSON.stringify({
      m: this.m,
      i: this.i,
      n: this.n,
      o: this.o
    })
  }
}

class DeFramer {
  constructor(data) {
    const frame = JSON.parse(data)

    if (frame.m === 1) {
      this.messageType = 'reply'
    } else if (frame.m === 3) {

      this.messageType = 'event'
    } else if (frame.m === 5) {

      this.messageType = 'error'
    } else {
      this.messageType = `Unknown (number ${frame.m})`
    }
    this.sequenceNumber = frame.i
    this.functionName = frame.n
    this.data = JSON.parse(frame.o)
  }
}

class NDAX {
  constructor(url) {
    this.requestSequenceNumber = 2
    this.responseSequenceNumber = 0 
    this.url = url
    this.ws = new WebSocket(url)

    this.ws.on('open', () => {
      this.ping()
      this.authenticate()
      this.products()

    })

    this.ws.on('error', (error) => {
      console.log(`${error}`)
    })

    this.ws.on('message', (data) => {
      const response = new DeFramer(data)
      if ( response.messageType === 'error') {
        console.error(response.data)
      } else if (response.messageType === 'reply') {
        this.responseSequenceNumber += 2
        this.requestSequenceNumber += 2
        console.log(response.data)
        return response.data
      } else if (response.messageType === 'event') {
        this.responseSequenceNumber += 2
        this.requestSequenceNumber += 2
        return response.data
      }

      
    })

    
  }
  ping = () => {
    const requestFrame = new Framer(
      'request',
      this.requestSequenceNumber,
      'ping',
      ''
    )
    this.ws.send(JSON.stringify(requestFrame))
  }

  products = () => {
    const requestFrame = new Framer(
      'request',
      this.requestSequenceNumber,
      'getproducts',
      {"OMSId": 1}
    )
    this.ws.send(JSON.stringify(requestFrame))
  }

  authenticate = (nonce) => {
    const requestFrame = new Framer(
      'request',
      this.requestSequenceNumber,
      'authenticateuser',
      {
        "APIKey": String(process.env.KEY),
        "Signature": this.signature("12345"),
        "UserId": String(process.env.USER_ID),
        "Nonce": "12345"
      }
    )
    this.ws.send(requestFrame.frame())
  }

  signature = (nonce) => {
    const hashString = nonce + process.env.USER_ID + process.env.KEY
    const secretString = process.env.SECRET
    var hmac= crypto.createHmac('sha256', Buffer.from(String(process.env.SECRET), 'ascii'))
    var hash = hmac.update(Buffer.from(hashString, 'ascii'))
    return hash.digest('hex')
  }

  getAccountInfo = () => {
    const requestFrame = new Framer(
      'request',
      this.requestSequenceNumber,
      'getuseraccountinfos',
      {
        "OMSId": 0,
      }
    )
  }
}


const ndax = new NDAX('wss://api.ndax.io/WSGateway/')


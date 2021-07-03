const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormbutton = document.querySelector('button')
const $shareLocation = document.querySelector('#share-location')
const $messages = document.querySelector('#messages')


//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#locationMessage-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyle = getComputedStyle($newMessage)
    const newMessagemargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessagemargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm A'),
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (locationMessage, username) => {
    console.log(locationMessage.url)
    const html = Mustache.render(locationMessageTemplate, {
        url: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('h:mm A'),
        username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    //disable
    &$messageFormbutton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        //enable
        $messageFormbutton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error) {
            return console.log(error)
        }

        console.log('Message was delivered!')
    })
})

$shareLocation.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    //disable
    $shareLocation.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(position)
        socket.emit('shareLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            //enable
            $shareLocation.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})
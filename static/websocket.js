import Mframe from "./framework/mframe.js"
export var connection
const getConnection = (roomid) => {
    if (connection && connection.readyState < 2) {
        return Promise.resolve(connection)
    }

    return new Promise((resolve, reject) => {
        if (window["WebSocket"]) {
            console.log(roomid)
            const conn = new WebSocket(`ws://localhost:8080/ws/${roomid}`)

            /* conn.onopen = function () {
                conn.send(JSON.stringify("hey"))
            } */

            conn.onerror = function (evt) {
                //Utils.showError(503)
                return
            }

            
            resolve(conn)
        } else {
            alert("Your browser does not support WebSockets")
        }
    })
}


const Ws = {
    connect: async (roomid) => {
        connection = await getConnection(roomid)
    },

    send: async (e) => {
        console.log("WS saadab backendi s6numi: ", JSON.stringify(e));
        connection.send(JSON.stringify(e))
    },

    disconnect: async () => {
        connection.close()
    }
}

export default Ws


const mackerel = require("./index.js")
const app = new mackerel(443)
const crypto = require('crypto');
const shasum = crypto.createHash('sha1');
app.all((req,res) => {
    if (req.headers.upgrade == "websocket"){
        shasum.update(req.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
        let hash = shasum.digest('base64');
        res.writeHead(101,"Switching Protocols",{
            Upgrade: "websocket",
            Connection: "Upgrade",
            "Sec-WebSocket-Accept":hash
        })
    }
})
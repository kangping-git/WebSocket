const http = require("http")
const fs = require("fs")
const readline = require('readline');
const path = require("path")
module.exports = class{
    /**
     * 
     * @param {Number} port 
     */
    #logs;
    #port;
    #started;
    #functions;
    #http_error;
    #access_count;
    #max_minute_request;
    #shell_path;
    #e;
    #do;
    #shell_commands;
    #shell_commanda;
    #server;
    #shell_command;
    #func;
    #all;
    constructor(port=3000){
        this.#logs = []
        this.#all = []
        this.#port = port
        this.#started = false
        this.#start()
        this.#functions = []
        this.#http_error = (req,res) => {
            res.write(String(res.statusCode))
            res.end()
        }
        this.#shell_commands = []
        this.#access_count = {}
        this.#max_minute_request = 100
        this.#shell_path = __dirname
        this.#e = (input_String) => {
            this.#do = false
            this.#shell_commands.forEach((value) => {
                if (value.shell_command(input_String) && !this.#do){
                    this.#do = true
                    let return_ = value.func(input_String)
                    if (return_){
                        console.log(return_)
                    }
                }
            })
            if (!this.#do){
                console.log("not found shell command")
            }
            const readInterface = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            readInterface.question(this.#shell_path + "> ",
                inputString=>{
                    readInterface.close()
                    setTimeout(() => {
                        this.#e(inputString)
                    },100)
                });
        }
        const readInterface = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        readInterface.question(this.#shell_path + "> ",
            inputString=>{
                readInterface.close()
                setTimeout(() => {
                    this.#e(inputString)
                },100)
            });
        this.#shell_commanda = new this.shell_command((shell_input) => {
            return shell_input.match(/^cd .+/g) != null
        })
        this.#shell_commanda.func = (shell_input) => {
            shell_input = shell_input.slice(3)
            try{
                let temp = path.join(this.#shell_path,shell_input)
                if (fs.existsSync(temp)){
                    if (fs.statSync(temp).isDirectory()){
                        this.#shell_path = temp
                    }else{
                        return "error"
                    }
                }else{
                    if (fs.existsSync(shell_input)){
                        if (fs.statSync(shell_input).isDirectory()){
                            this.#shell_path = path.join(shell_input)
                        }else{
                            return "error"
                        }
                    }else{
                        return "error"
                    }
                }
            }catch(err){
                return "error"
            }
        }
        this.add_shell_command(this.#shell_commanda)
        this.#shell_commanda = new this.shell_command((shell_input) => {
            return shell_input.match(/^ls/g) != null
        })
        this.#shell_commanda.func = (shell_input) => {
            let temp = fs.readdirSync(this.#shell_path + "\\",{withFileTypes:true})
            temp.sort((a,b) => {
                if (a.isFile() && b.isDirectory()){
                    return 1
                }else{
                    return 0
                }
            })
            let max = 0
            temp.forEach((value) => {
                if (max < count(value.name)){
                    max = count(value.name)
                }
            })
            temp = temp.map((value) => {
                return (value.name + " ".repeat(max+5-count(value.name))) + "| " + (fs.statSync(path.join(this.#shell_path,value.name)).isFile() ? fs.statSync(path.join(this.#shell_path,value.name)).size : "")
            })
            return "file-name" + " ".repeat(max+5-count("file-name")) + "| size" + "\n" + "-".repeat(max+15) + "\n" + temp.join("\n")
        }
        this.add_shell_command(this.#shell_commanda)
        this.#shell_commanda = new this.shell_command((shell_input) => {
            return shell_input.match(/^close/g) != null
        })
        this.#shell_commanda.func = (shell_input) => {
            this.#server.close((err) => {
                return err
            })
            this.#started = false
        }
        this.add_shell_command(this.#shell_commanda)
        this.#shell_commanda = new this.shell_command((shell_input) => {
            return shell_input.match(/^start/g) != null
        })
        this.#shell_commanda.func = (shell_input) => {
            if (!this.#started){
                if (shell_input.split(" ").length > 1){
                    shell_input = shell_input.split(" ")
                    shell_input.shift()
                    shell_input = shell_input.join(" ")
                }
                if (Number(shell_input) != NaN){
                    if (0 <= Number(shell_input) && Number(shell_input) <= 65535){
                        this.#port = Number(shell_input)
                    }
                }
                this.#start()
                return this.#port
            }else{
                return "already started server"
            }
        }
        this.add_shell_command(this.#shell_commanda)
        this.#shell_commanda = new this.shell_command((shell_input) => {
            return shell_input.match(/^logs +[0-9]+/g) != null
        })
        this.#shell_commanda.func = (shell_input) => {
            let max = 0
            let temp = this.#logs.map((value) => {
                return value.url
            })
            temp = temp.slice(0,Number(shell_input.split(" ")[shell_input.split(" ").length-1]))
            temp.forEach((value) => {
                if (max < count(value)){
                    max = count(value)
                }
            })
            temp = temp.map((value,index) => {
                return (value + " ".repeat(max+5-count(value))) + "| " + (this.#logs[index].method + " ".repeat(6+5-count(this.#logs[index].method))) + "| " + (this.#logs[index].time + " ".repeat(23+5-count(this.#logs[index].time))) + "| " + (this.#logs[index].status + " ".repeat(6-count(this.#logs[index].status)))
            })
            temp.reverse()
            return "url"+ " ".repeat(max+5-count("url")) + "| method" + " ".repeat(6+5-count("method")) + "| time" + " ".repeat(23+5-count("time")) + "| status" + "\n" + "-".repeat(max+5+11+23+6+5+6) + "\n" + temp.join("\n")
        }
        this.add_shell_command(this.#shell_commanda)
    }
    /**
     * 
     * @param {String} url 
     * @param  {function} func 
     */
    get(url,func){
        this.#functions.push({
            url:url,
            func:func,
            method:"GET"
        })
    }
    post(url,func){
        this.#functions.push({
            url:url,
            func:func,
            method:"POST"
        })
    }
    all(func){
        this.#all.push({
            func:func
        })
    }
    /**
     * 
     * @param {shell_command} shell_command 
     */
    add_shell_command(shell_command){
        this.#shell_commands.push(shell_command)
    }
    get shell_command(){
        return class{
            /**
             * 
             * @param {String} shell_command_check
             */
            constructor(shell_command){
                this.shell_command = shell_command
                this.func = () => {}
            }
        }
    }
    do_shell_command(shell_command){
        this.#e(shell_command)
    }
    #start(){
        try{
            this.#server = http.createServer((req,res) => {
                let err = ""
                let func = this.#functions.filter((value) => {
                    if (req.method == value.method && req.url == value.url){
                        return true
                    }else{
                        return false
                    }
                })
                this.#all.forEach((value) => {
                    value.func(req,res,() => {
                        this.#do = true
                    })
                })
                if (func.length > 0){
                    try{
                        for (var i in func){
                            func[i].func(req,res)
                        }
                    }catch (err){
                        err = err
                        res.statusCode = 500
                        res.statusMessage = "Internal Server Error"
                        this.#http_error(req,res)
                    }
                }else{
                    res.statusCode = 404
                    res.statusMessage = "not found"
                    this.#http_error(req,res)
                }
                this.#logs.unshift({
                    ip:req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    method:req.method,
                    url:req.url,
                    status:res.statusCode,
                    time:new Date().getFullYear() + "/" + ("00" + new Date().getMonth()).slice(-2) + "/" + ("00" + new Date().getDate()).slice(-2) + " " + ("00" + new Date().getHours()).slice(-2) + ":" + ("00" + new Date().getMinutes()).slice(-2) + ":" + ("00" + new Date().getSeconds()).slice(-2) + "." + ("000" + new Date().getMilliseconds()).slice(-3),
                    err:err
                })
            }).listen(this.#port)
            this.#started = true
        }catch(err){
            console.log("already used port '" + this.#port + "'");
        }
    }
}
function count(n) {
    let len = 0;
    for (i = 0; i < n.length; i++) {
        if (n[i].match(/[ -~]/)) {
            len += 1;
        }else{
            len += 2;
        }
    }
    return len
}
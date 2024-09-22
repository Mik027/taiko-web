class PageEvents{
	constructor(...args){
		this.init(...args)
	}
	init(){
		this.allEvents = new Map()
		this.keyListeners = new Map()
		this.mouseListeners = new Map()
		this.blurListeners = new Map()
		this.lastKeyEvent = -Infinity
		this.add(window, "keydown", this.keyEvent.bind(this))
		this.add(window, "keyup", this.keyEvent.bind(this))
		this.add(window, "mousemove", this.mouseEvent.bind(this))
		this.add(window, "blur", this.blurEvent.bind(this))
		this.kbd = []
	}
	add(target, type, callback, symbol){
		if(Array.isArray(type)){
			type.forEach(type => this.add(target, type, callback, symbol))
			return
		}
		this.remove(target, type)
		var addedEvent = this.allEvents.get(symbol || target)
		if(!addedEvent){
			addedEvent = new Map()
			this.allEvents.set(symbol || target, addedEvent)
		}
		addedEvent.set(type, callback)
		return target.addEventListener(type, callback)
	}
	remove(target, type, symbol){
		if(Array.isArray(type)){
			type.forEach(type => this.remove(target, type, symbol))
			return
		}
		var addedEvent = this.allEvents.get(symbol || target)
		if(addedEvent){
			var callback = addedEvent.get(type)
			if(callback){
				target.removeEventListener(type, callback)
				addedEvent.delete(type)
				if(addedEvent.size == 0){
					return this.allEvents.delete(symbol || target)
				}
			}
		}
	}
	once(target, type, symbol){
		return new Promise(resolve => {
			this.add(target, type, event => {
				this.remove(target, type)
				return resolve(event)
			}, symbol)
		})
	}
	race(){
		var symbols = []
		var target = arguments[0]
		return new Promise(resolve => {
			for(var i = 1;i < arguments.length; i++){
				symbols[i] = Symbol()
				let type = arguments[i]
				this.add(target, type, event => {
					resolve({
						type: type,
						event: event
					})
				}, symbols[i])
			}
		}).then(response => {
			for(var i = 1;i < arguments.length; i++){
				this.remove(target, arguments[i], symbols[i])
			}
			return response
		})
	}
	load(target){
		return new Promise((resolve, reject) => {
			this.race(target, "load", "error", "abort").then(response => {
				switch(response.type){
					case "load":
						return resolve(response.event)
					case "error":
						return reject(["Loading error", target])
					case "abort":
						return reject("Loading aborted")
				}
			})
		})
	}
	keyEvent(event){
		if(!("key" in event) || event.ctrlKey && (event.key === "c" || event.key === "x" || event.key === "v")){
			return
		}
		if(this.kbd.indexOf(event.key.toLowerCase()) !== -1){
			this.lastKeyEvent = Date.now()
			if(event.target.tagName !== "INPUT"){
				event.preventDefault()
			}
		}
		this.keyListeners.forEach(addedKeyCode => {
			this.checkListener(addedKeyCode.get("all"), event)
			this.checkListener(addedKeyCode.get(event.keyCode), event)
		})
	}
	checkListener(keyObj, event){
		if(keyObj && (
			keyObj.type === "both"
			|| keyObj.type === "down" && event.type === "keydown"
			|| keyObj.type === "up" && event.type === "up"
		)){
			keyObj.callback(event)
		}
	}
	keyAdd(target, keyCode, type, callback){
		// keyCode="all", type="both"
		var addedKeyCode = this.keyListeners.get(target)
		if(!addedKeyCode){
			addedKeyCode = new Map()
			this.keyListeners.set(target, addedKeyCode)
		}
		addedKeyCode.set(keyCode, {
			type: type,
			callback: callback
		})
	}
	keyRemove(target, keyCode){
		var addedKeyCode = this.keyListeners.get(target)
		if(addedKeyCode){
			var keyObj = addedKeyCode.get(keyCode)
			if(keyObj){
				addedKeyCode.delete(keyCode)
				if(addedKeyCode.size == 0){
					return this.keyListeners.delete(target)
				}
			}
		}
	}
	keyOnce(target, keyCode, type){
		return new Promise(resolve => {
			this.keyAdd(target, keyCode, type, event => {
				this.keyRemove(target, keyCode)
				return resolve(event)
			})
		})
	}
	mouseEvent(event){
		this.lastMouse = event
		this.mouseListeners.forEach(callback => callback(event))
	}
	mouseAdd(target, callback){
		this.mouseListeners.set(target, callback)
	}
	mouseRemove(target){
		this.mouseListeners.delete(target)
	}
	blurEvent(event){
		this.blurListeners.forEach(callback => callback(event))
	}
	blurAdd(target, callback){
		this.blurListeners.set(target, callback)
	}
	blurRemove(target){
		this.blurListeners.delete(target)
	}
	getMouse(){
		return this.lastMouse
	}
	send(name, detail){
		dispatchEvent(new CustomEvent(name, {detail: detail}))
	}
	setKbd(){
		this.kbd = []
		var kbdSettings = settings.getItem("keyboardSettings")
		for(var name in kbdSettings){
			var keys = kbdSettings[name]
			for(var i in keys){
				this.kbd.push(keys[i])
			}
		}
	}
}

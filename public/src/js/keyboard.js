class Keyboard{
	constructor(...args){
		this.init(...args)
	}
	init(bindings, callback){
		this.bindings = bindings
		this.callback = callback
		this.wildcard = false
		this.substitute = {
			"up": "arrowup",
			"right": "arrowright",
			"down": "arrowdown",
			"left": "arrowleft",
			"space": " ",
			"esc": "escape",
			"ctrl": "control",
			"altgr": "altgraph"
		}
		this.btn = {}
		this.TaikoForceLv5 = false;
		this.update()
		pageEvents.keyAdd(this, "all", "both", this.keyEvent.bind(this))
		pageEvents.blurAdd(this, this.blurEvent.bind(this))
	}
	isTaikoForceLv5(kbdSettings){
		// the key of Taiko Force Lv5's PC module looks like this
		return (kbdSettings.ka_l[0] === "f") && (kbdSettings.ka_r[0] === "e") && (kbdSettings.don_l[0] === "i") && (kbdSettings.don_r[0] === "j");
	}
	update(){
		var kbdSettings = settings.getItem("keyboardSettings")
		this.TaikoForceLv5 = this.isTaikoForceLv5(kbdSettings)
		var drumKeys = {}
		for(var name in kbdSettings){
			var keys = kbdSettings[name]
			for(var i in keys){
				drumKeys[keys[i]] = name
			}
		}
		this.kbd = {}
		for(var name in this.bindings){
			var keys = this.bindings[name]
			for(var i in keys){
				var key = keys[i]
				if(key in drumKeys){
					continue
				}
				if(key in kbdSettings){
					var keyArray = kbdSettings[key]
					for(var j in keyArray){
						key = keyArray[j]
						if(!(key in this.kbd)){
							this.kbd[key] = name
						}
					}
				}else{
					if(key in this.substitute){
						key = this.substitute[key]
					}
					if(!(key in this.kbd)){
						if(key === "wildcard"){
							this.wildcard = true
						}
						this.kbd[key] = name
					}
				}
			}
		}
	}
	keyEvent(event){
		var key = event.key.toLowerCase()
		if(event.target.tagName === "INPUT"){
			if(key === "escape"){
				event.preventDefault()
			}
		}else if(
			key === "escape" ||
			key === "backspace" ||
			key === "tab" ||
			key === "contextmenu" ||
			key === "alt"
		){
			event.preventDefault()
		}
		if(!event.repeat){
			var pressed = event.type === "keydown"
			if(pressed){
				this.btn[key] = true
			}else{
				delete this.btn[key]
				if(key in this.kbd){
					for(var i in this.btn){
						if(this.kbd[i] === this.kbd[key]){
							return
						}
					}
				}
			}
			if(key in this.kbd){
				this.callback(pressed, this.kbd[key], event)
			}else if(this.wildcard){
				this.callback(pressed, this.kbd["wildcard"], event)
			}
		}
	}
	blurEvent(){
		for(var key in this.btn){
			if(this.btn[key]){
				delete this.btn[key]
				var name = this.kbd[key] || (this.wildcard ? "wildcard" : false)
				if(name){
					this.callback(false, name)
				}
			}
		}
	}
	clean(){
		pageEvents.keyRemove(this, "all")
		pageEvents.blurRemove(this)
		delete this.bindings
		delete this.callback
		delete this.kbd
		delete this.btn
	}
}

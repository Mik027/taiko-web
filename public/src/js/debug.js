class Debug{
	constructor(...args){
		this.init(...args)
	}
	init(){
		if(!assets.pages["debug"]){
			return
		}
		this.debugDiv = document.createElement("div")
		this.debugDiv.id = "debug"
		this.debugDiv.innerHTML = assets.pages["debug"]
		document.body.appendChild(this.debugDiv)
		
		this.titleDiv = this.byClass("title")
		this.minimiseDiv = this.byClass("minimise")
		this.offsetDiv = this.byClass("offset")
		this.measureNumDiv = this.byClass("measure-num")
		this.branchHideDiv = this.byClass("branch-hide")
		this.branchSelectDiv = this.byClass("branch-select")
		this.branchSelect = this.branchSelectDiv.getElementsByTagName("select")[0]
		this.branchResetBtn = this.branchSelectDiv.getElementsByClassName("reset")[0]
		this.volumeDiv = this.byClass("music-volume")
		this.lyricsHideDiv = this.byClass("lyrics-hide")
		this.lyricsOffsetDiv = this.byClass("lyrics-offset")
		this.restartLabel = this.byClass("change-restart-label")
		this.restartCheckbox = this.byClass("change-restart")
		this.autoplayLabel = this.byClass("autoplay-label")
		this.autoplayCheckbox = this.byClass("autoplay")
		this.restartBtn = this.byClass("restart-btn")
		this.exitBtn = this.byClass("exit-btn")
		
		this.moving = false
		this.windowSymbol = Symbol()
		pageEvents.add(window, ["mousedown", "mouseup", "touchstart", "touchend", "blur", "resize"], this.stopMove.bind(this), this.windowSymbol)
		pageEvents.mouseAdd(this, this.onMove.bind(this))
		pageEvents.add(window, "touchmove", this.onMove.bind(this))
		pageEvents.add(this.titleDiv, ["mousedown", "touchstart"], this.startMove.bind(this))
		pageEvents.add(this.minimiseDiv, ["click", "touchstart"], this.minimise.bind(this))
		pageEvents.add(this.restartBtn, ["click", "touchstart"], this.restartSong.bind(this))
		pageEvents.add(this.exitBtn, ["click", "touchstart"], this.clean.bind(this))
		pageEvents.add(this.restartLabel, "touchstart", this.touchBox.bind(this))
		pageEvents.add(this.autoplayLabel, "touchstart", this.touchBox.bind(this))
		pageEvents.add(this.autoplayCheckbox, "change", this.toggleAutoplay.bind(this))
		pageEvents.add(this.branchSelect, "change", this.branchChange.bind(this))
		pageEvents.add(this.branchResetBtn, ["click", "touchstart"], this.branchReset.bind(this))
		
		this.offsetSlider = new InputSlider(this.offsetDiv, -60, 60, 3)
		this.offsetSlider.onchange(this.offsetChange.bind(this))
		
		this.measureNumSlider = new InputSlider(this.measureNumDiv, 0, 1000, 0)
		this.measureNumSlider.onchange(this.measureNumChange.bind(this))
		this.measureNumSlider.set(0)
		
		this.volumeSlider = new InputSlider(this.volumeDiv, 0, 3, 2)
		this.volumeSlider.onchange(this.volumeChange.bind(this))
		this.volumeSlider.set(1)
		
		this.lyricsSlider = new InputSlider(this.lyricsOffsetDiv, -60, 60, 3)
		this.lyricsSlider.onchange(this.lyricsChange.bind(this))
		
		this.moveTo(100, 100)
		this.restore()
		this.updateStatus()
		pageEvents.send("debug")
	}
	byClass(name){
		return this.debugDiv.getElementsByClassName(name)[0]
	}
	startMove(event){
		if(event.which === 1 || event.type === "touchstart"){
			event.stopPropagation()
			var divPos = this.debugDiv.getBoundingClientRect()
			var click = event.type === "touchstart" ? event.changedTouches[0] : event
			var x = click.pageX - divPos.left
			var y = click.pageY - divPos.top
			this.moving = {x: x, y: y}
		}
	}
	onMove(event){
		if(this.moving){
			var click = event.type === "touchmove" ? event.changedTouches[0] : event
			var x = click.clientX - this.moving.x
			var y = click.clientY - this.moving.y
			this.moveTo(x, y)
		}
	}
	stopMove(event){
		if(this.debugDiv.style.display === "none"){
			return
		}
		if(!event || event.type === "resize"){
			var divPos = this.debugDiv.getBoundingClientRect()
			var x = divPos.left
			var y = divPos.top
		}else{
			var click = event.type === "touchstart" || event.type === "touchend" ? event.changedTouches[0] : event
			if(event.type == "blur"){
				var x = this.moving.x
				var y = this.moving.y
			}else{
				var x = click.clientX - this.moving.x
				var y = click.clientY - this.moving.y
			}
		}
		var w = this.debugDiv.offsetWidth
		var h = this.debugDiv.offsetHeight
		if(x + w > innerWidth){
			x = innerWidth - w
		}
		if(y + h > lastHeight){
			y = lastHeight - h
		}
		if(x < 0){
			x = 0
		}
		if(y < 0){
			y = 0
		}
		this.moveTo(x, y)
		this.moving = false
	}
	moveTo(x, y){
		this.debugDiv.style.transform = "translate(" + x + "px, " + y + "px)"
	}
	restore(){
		debugObj.state = "open"
		this.debugDiv.style.display = ""
		this.stopMove()
	}
	minimise(){
		debugObj.state = "minimised"
		this.debugDiv.style.display = "none"
	}
	updateStatus(){
		if(debugObj.controller && !this.controller){
			this.controller = debugObj.controller
			
			this.restartBtn.style.display = "block"
			this.autoplayLabel.style.display = "block"
			if(this.controller.parsedSongData.branches){
				this.branchHideDiv.style.display = "block"
			}
			if(this.controller.lyrics){
				this.lyricsHideDiv.style.display = "block"
			}
			
			var selectedSong = this.controller.selectedSong
			this.defaultOffset = selectedSong.offset || 0
			if(this.songHash === selectedSong.hash){
				this.offsetChange(this.offsetSlider.get(), true)
				this.branchChange(null, true)
				this.volumeChange(this.volumeSlider.get(), true)
				this.lyricsChange(this.lyricsSlider.get(), true)
			}else{
				this.songHash = selectedSong.hash
				this.offsetSlider.set(this.defaultOffset)
				this.branchReset(null, true)
				this.volumeSlider.set(this.controller.volume)
				this.lyricsSlider.set(this.controller.lyrics ? this.controller.lyrics.vttOffset / 1000 : 0)
			}
			
			var measures = this.controller.parsedSongData.measures.filter((measure, i, array) => {
				return i === 0 || Math.abs(measure.ms - array[i - 1].ms) > 0.01
			})
			this.measureNumSlider.setMinMax(0, measures.length - 1)
			if(this.measureNum > 0 && measures.length >= this.measureNum){
				var measureMS = measures[this.measureNum - 1].ms
				var game = this.controller.game
				game.started = true
				var timestamp = Date.now()
				var currentDate = timestamp - measureMS
				game.startDate = currentDate
				game.sndTime = timestamp - snd.buffer.getTime() * 1000
				var circles = game.songData.circles
				for(var i in circles){
					game.currentCircle = i
					if(circles[i].endTime >= measureMS){
						break
					}
					game.skipNote(circles[i])
				}
				if(game.mainMusicPlaying){
					game.mainMusicPlaying = false
					game.mainAsset.stop()
				}
			}
			this.autoplayCheckbox.checked = this.controller.autoPlayEnabled
		}
		if(this.controller && !debugObj.controller){
			this.restartBtn.style.display = ""
			this.autoplayLabel.style.display = ""
			this.branchHideDiv.style.display = ""
			this.lyricsHideDiv.style.display = ""
			this.controller = null
		}
		this.stopMove()
	}
	offsetChange(value, noRestart){
		if(this.controller){
			var offset = (this.defaultOffset - value) * 1000
			var songData = this.controller.parsedSongData
			songData.circles.forEach(circle => {
				circle.ms = circle.originalMS + offset
				circle.endTime = circle.originalEndTime + offset
			})
			songData.measures.forEach(measure => {
				measure.ms = measure.originalMS + offset
			})
			if(songData.branches){
				songData.branches.forEach(branch => {
					branch.ms = branch.originalMS + offset
				})
			}
			if(this.controller.lyrics){
				this.controller.lyrics.offsetChange(value * 1000)
			}
			if(this.restartCheckbox.checked && !noRestart){
				this.restartSong()
			}
		}
	}
	measureNumChange(value){
		this.measureNum = value
		if(this.restartCheckbox.checked){
			this.restartSong()
		}
	}
	volumeChange(value, noRestart){
		if(this.controller){
			snd.musicGain.setVolumeMul(value)
		}
		if(this.restartCheckbox.checked && !noRestart){
			this.restartSong()
		}
	}
	lyricsChange(value, noRestart){
		if(this.controller && this.controller.lyrics){
			this.controller.lyrics.offsetChange(undefined, value * 1000)
		}
		if(this.restartCheckbox.checked && !noRestart){
			this.restartSong()
		}
	}
	restartSong(){
		if(this.controller){
			this.controller.restartSong()
		}
	}
	toggleAutoplay(event){
		if(this.controller){
			this.controller.autoPlayEnabled = this.autoplayCheckbox.checked
			if(this.controller.autoPlayEnabled){
				this.controller.saveScore = false
			}else{
				var keyboard = debugObj.controller.keyboard
				keyboard.setKey(false, "don_l")
				keyboard.setKey(false, "don_r")
				keyboard.setKey(false, "ka_l")
				keyboard.setKey(false, "ka_r")
			}
		}
	}
	branchChange(event, noRestart){
		if(this.controller){
			var game = this.controller.game
			var name = this.branchSelect.value
			game.branch = name === "auto" ? false : name
			game.branchSet = name === "auto"
			if(noRestart){
				game.branchStatic = true
			}
			var selectedOption = this.branchSelect.selectedOptions[0]
			this.branchSelect.style.background = selectedOption.style.background
			if(this.restartCheckbox.checked && !noRestart){
				this.restartSong()
			}
		}
	}
	branchReset(event, noRestart){
		this.branchSelect.value = "auto"
		this.branchChange(null, noRestart)
	}
	touchBox(event){
		event.currentTarget.click()
	}
	clean(){
		this.offsetSlider.clean()
		this.measureNumSlider.clean()
		this.volumeSlider.clean()
		this.lyricsSlider.clean()
		
		pageEvents.remove(window, ["mousedown", "mouseup", "touchstart", "touchend", "blur", "resize"], this.windowSymbol)
		pageEvents.mouseRemove(this)
		pageEvents.remove(window, "touchmove")
		pageEvents.remove(this.titleDiv, ["mousedown", "touchstart"])
		pageEvents.remove(this.minimiseDiv, ["click", "touchstart"])
		pageEvents.remove(this.restartBtn, ["click", "touchstart"])
		pageEvents.remove(this.exitBtn, ["click", "touchstart"])
		pageEvents.remove(this.restartLabel, "touchstart")
		pageEvents.remove(this.autoplayLabel, "touchstart")
		pageEvents.remove(this.autoplayCheckbox, "change")
		pageEvents.remove(this.branchSelect, "change")
		pageEvents.remove(this.branchResetBtn, ["click", "touchstart"])
		
		delete this.offsetSlider
		delete this.measureNumSlider
		delete this.volumeSlider
		delete this.titleDiv
		delete this.minimiseDiv
		delete this.offsetDiv
		delete this.measureNumDiv
		delete this.branchHideDiv
		delete this.branchSelectDiv
		delete this.branchSelect
		delete this.branchResetBtn
		delete this.volumeDiv
		delete this.lyricsHideDiv
		delete this.lyricsOffsetDiv
		delete this.restartCheckbox
		delete this.autoplayLabel
		delete this.autoplayCheckbox
		delete this.restartBtn
		delete this.exitBtn
		delete this.controller
		delete this.windowSymbol
		
		debugObj.state = "closed"
		debugObj.debug = null
		document.body.removeChild(this.debugDiv)
		
		delete this.debugDiv
	}
}
class InputSlider{
	constructor(...args){
		this.init(...args)
	}
	init(sliderDiv, min, max, fixedPoint){
		this.fixedPoint = fixedPoint
		this.mul = Math.pow(10, fixedPoint)
		this.min = min * this.mul
		this.max = max * this.mul
		
		this.input = sliderDiv.getElementsByTagName("input")[0]
		this.reset = sliderDiv.getElementsByClassName("reset")[0]
		this.plus = sliderDiv.getElementsByClassName("plus")[0]
		this.minus = sliderDiv.getElementsByClassName("minus")[0]
		this.value = null
		this.defaultValue = null
		this.callbacks = []
		this.touchEnd = []
		this.windowSymbol = Symbol()
		pageEvents.add(this.input, ["touchstart", "touchend"], event => {
			event.stopPropagation()
		})
		pageEvents.add(window, ["mouseup", "touchstart", "touchend", "blur"], event => {
			if(event.type !== "touchstart"){
				this.touchEnd.forEach(func => func(event))
			}else if(event.target !== this.input){
				this.input.blur()
			}
		}, this.windowSymbol)
		
		this.addTouchRepeat(this.plus, this.add.bind(this))
		this.addTouchRepeat(this.minus, this.subtract.bind(this))
		this.addTouch(this.reset, this.resetValue.bind(this))
		pageEvents.add(this.input, "change", this.manualSet.bind(this))
		pageEvents.add(this.input, "keydown", this.captureKeys.bind(this))
	}
	update(noCallback, force){
		var oldValue = this.input.value
		if(this.value === null){
			this.input.value = ""
			this.input.readOnly = true
		}else{
			if(this.value > this.max){
				this.value = this.max
			}
			if(this.value < this.min){
				this.value = this.min
			}
			this.input.value = this.get().toFixed(this.fixedPoint)
			this.input.readOnly = false
		}
		if(force || !noCallback && oldValue !== this.input.value){
			this.callbacks.forEach(callback => {
				callback(this.get())
			})
		}
	}
	set(number){
		this.value = Math.floor(number * this.mul)
		this.defaultValue = this.value
		this.update(true)
	}
	setMinMax(min, max){
		this.min = min
		this.max = max
		this.update()
	}
	get(){
		if(this.value === null){
			return null
		}else{
			return Math.floor(this.value) / this.mul
		}
	}
	add(event){
		if(this.value !== null){
			var newValue = this.value + this.eventNumber(event)
			if(newValue <= this.max){
				this.value = newValue
				this.update()
			}
		}
	}
	subtract(event){
		if(this.value !== null){
			var newValue = this.value - this.eventNumber(event)
			if(newValue >= this.min){
				this.value = newValue
				this.update()
			}
		}
	}
	eventNumber(event){
		return (event.ctrlKey ? 10 : 1) * (event.shiftKey ? 10 : 1) * (event.altKey ? 10 : 1) * 1
	}
	resetValue(){
		this.value = this.defaultValue
		this.update()
	}
	onchange(callback){
		this.callbacks.push(callback)
	}
	manualSet(){
		var number = parseFloat(this.input.value) * this.mul
		if(Number.isFinite(number) && this.min <= number && number <= this.max){
			this.value = number
		}
		this.update(false, true)
	}
	captureKeys(event){
		event.stopPropagation()
	}
	addTouch(element, callback){
		pageEvents.add(element, ["mousedown", "touchstart"], event => {
			if(event.type === "touchstart"){
				event.preventDefault()
			}else if(event.which !== 1){
				return
			}
			callback(event)
		})
	}
	addTouchRepeat(element, callback){
		this.addTouch(element, event => {
			var active = true
			var func = () => {
				active = false
				this.touchEnd.splice(this.touchEnd.indexOf(func), 1)
			}
			this.touchEnd.push(func)
			var repeat = delay => {
				if(active && this.touchEnd){
					callback(event)
					setTimeout(() => repeat(50), delay)
				}
			}
			repeat(400)
		})
	}
	removeTouch(element){
		pageEvents.remove(element, ["mousedown", "touchstart"])
	}
	clean(){
		this.removeTouch(this.plus)
		this.removeTouch(this.minus)
		this.removeTouch(this.reset)
		pageEvents.remove(this.input, ["touchstart", "touchend"])
		pageEvents.remove(window, ["mouseup", "touchstart", "touchend", "blur"], this.windowSymbol)
		pageEvents.remove(this.input, ["touchstart", "change", "keydown"])
		
		delete this.input
		delete this.reset
		delete this.plus
		delete this.minus
		delete this.windowSymbol
		delete this.touchEnd
	}
}

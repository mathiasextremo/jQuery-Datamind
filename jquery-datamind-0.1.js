/**
 * DataMind - One way to rule all data
 * @requires jQuery v1.x.x
 *
 * http://www.avril.co/
 *
 * Copyright (c) 2012 Mathias Extremo (avril.co)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * Version: 0.0.1
 */
(function($, undefined){
	
	function DataMind(){
		this._data = {}; // data collection
		this._eventHandlers = {}; // Event handlers collection
	}

	var dataModel = {
			name: null,
			creation: null,
			update: null,
			value: null,
			setValue: function(v, silent, jQo){

				var val = this.value;
				this.value = v;
				this.update = new Date();

				if(!silent){
					jQo.trigger({type: 'changed', newValue: this.value, lateValue: val, datamind: {newValue: this.value, lateValue: val}});
				}

				return this;
			}
		},
		jQModel = {
			setValue: function(v, silent){

				this[0].setValue(v, silent, this);

				return this;
			},
			getValue: function(){

				return this[0].value;

			},
			push: function(v){
				
				return $.datamind.push(this[0].name, v);
				
			},
		};
	
	$.extend(DataMind.prototype, {
		/* Debug logging (if enabled). */
		_loopIndex: 0, // used to prevent infinite event recursive call
		_stopLooping: 100,
		_eventPrefix: 'datamind_',
		log: function(){
			if (this.debug)
				console.log.apply('', arguments);
			
		},
		/*
		_onEvent: function(inst, evArgs){
			
			var j=0,
				eventName = '',
				eventObj = null,
				handlersList = null,
				subscriber = null;
			
			// loop on events
			for(eventName in evArgs.events){
				
				// event object
				eventObj = evArgs.events[eventName];
				
				// if event already exists
				if(eventName in this._eventHandlers){
					
					handlersList = this._eventHandlers[eventName];
					
					// caller doesn't exists
					handlersList.subscribers.push({
						inst: inst,
						data: evArgs.data,
						target: evArgs.target
					});
					
				}else{
					
					this._eventHandlers[eventName] = {
						subscribers:
							[
								{
									inst: inst,
									data: evArgs.data,
									target: evArgs.target
								}
							]
					};
					
				}
			}
			
			// liste
			var arg = {},
				tmp = null;
				
			for(j in evArgs.events){
				
				arg[this._convertEventName(this._eventPrefix+j)] = evArgs.events[j];
				
			}
			
			if(evArgs.target){
				
				inst.on(arg, evArgs.target, evArgs.data);
				
			}else{
				
				inst.on(arg, evArgs.data);
				
			}
			
			return inst;
			
		},
		_offEvent: function(inst, evArgs){
			
			var j=0,
				eventName = '',
				eventObj = null,
				handlersList = null,
				subscriber = null;
			
			// loop on events
			for(eventName in evArgs.events){
				
				// event object
				eventObj = evArgs.events[eventName];
				
				// if event already exists
				if(eventName in this._eventHandlers){
					
					handlersList = this._eventHandlers[eventName];
					
					// loop on objects that already subscribed to the event
					for(j=handlersList.subscribers.length-1;j>=0;--j){
						
						subscriber = handlersList.subscribers[j];
						
						if(subscriber.inst.is(inst) && subscriber.target == evArgs.target){
							
							arrayRemove(handlersList.subscribers, j, j);
							
							if(evArgs.target){
								
								inst.off(this._eventPrefix+eventName, evArgs.target);
								
							}else{
								
								inst.off(this._eventPrefix+this._separator+eventName);
								
							}
							
							break;
						}
					}
					
				}
			}
			
			return inst;
			
		},
		_convertEventName: function(eventName){

			return eventName.replace(':','_');

		},
		_launchEvent: function(eventName, datamindData){
			
			if(eventName in this._eventHandlers){
				
				var handlersList = this._eventHandlers[eventName],
					data = {},
					eventObj = null;
					j = 0;
				
				// loop on objects that already subscribed to the event
				for(j=handlersList.subscribers.length-1;j>=0;--j){
					
					eventObj = $.Event(this._convertEventName(this._eventPrefix+eventName));

					eventObj.datamind = datamindData;
					
					subscriber = handlersList.subscribers[j];
					eventObj.data = subscriber.data;
					
					if(subscriber.target){
						
						subscriber.inst.find(subscriber.target).trigger(eventObj);
						
					}else{
						
						subscriber.inst.trigger(eventObj);
						
					}

					if(eventObj.isDefaultPrevented()){

						return false;

					}
				}
			}
			return true;

		},
		*/
		_launchEvent: function(eventName, datamindData){
			
			var eventObj = $.Event(eventName);

			eventObj.datamind = datamindData;
			
			$.event.trigger(eventObj);

			return !eventObj.isDefaultPrevented();
			
		},
		// initialize the data
		init: function(options){
			
			//check keys don't contains "."
			
			for(var i in options){
				
				if(i.indexOf('.') > -1){
					
					console.error('DataMind : Field can\'t contain "."');
					return;
				}
				
			}
			
			//$.extend(this._data, options || {});
			var item = null,
				nDate = new Date(),
				that = this;

			for(var data in options){

				item = $($.extend({}, dataModel, {
					name: data,
					creation: nDate,
				}));

				item = $.extend(item, jQModel);

				item.on('changed', (function(d){

					return function(e){
							// value changed
							//evName = data+'_changed';
							var evName = d+':changed';
							
							that._launchEvent(evName, {
								lateValue: e.lateValue,
								newValue: e.newValue
							});
							
						};

					})(data)
				);
				
				this._data[data] = item.setValue(options[data], true);

			}

		},
		// generic accessors
		set: function(data, value, silent){
			
			silent = silent != undefined && silent;
			
			if(typeof data == 'string'){
				
				this._loopIndex++;
				
				if(this._loopIndex > this._stopLooping){
					
					console.error('DataMind : Infinite call of the set method ... (more than '+this._stopLooping+'). You might not set values in a datamind event.');
					
					return false;
					
				}

				var nDate = new Date();

				var alreadyExists = (data in this._data),
					evName = '',
					lateValue = null,
					item = null,
					that = this;
				
				if(!alreadyExists){
					
					var item = $($.extend({}, dataModel, {
						name: data,
						creation: nDate,
					}));

					item = $.extend(item, jQModel);

					item.on('changed', function(e){
						// value changed
						//evName = data+'_changed';
						evName = data+':changed';
						
						that._launchEvent(evName, {
							lateValue: e.lateValue,
							newValue: e.newValue
						});
						
					})

					item.setValue(value, true);
					
					this._data[data] = item;

					if(data.indexOf('.') > -1){
						
						console.error('DataMind : Field can\'t contain "."');
						
						return false;
					}
					
					if(!silent){

						evName = data+':created';
						// value created
						this._launchEvent(evName, {
							newValue: value
						});
					}
				}else{

					lateValue = this._data[data];

					if(!silent){
						// value changing
						//evName = data+'_changing';
						evName = data+':changing';

						if(
							!this._launchEvent(evName, {
								lateValue: lateValue.getValue(),
								newValue: value
							})
						){

							return false;
						}
						
					}

					// change the value
					item = this._data[data];
					item.setValue(value, silent);
				}
				
				// change the value
				//this._data[data] = value;

			}
			
			this._loopIndex = 0;
			return true;
		},
		_checkField: function(data){	// check the existence of the field
			
			if(typeof data == 'string'){
				
				if(data in this._data){
					
					return true;
					
				}else{
					
					console.error('DataMind : The field ('+data+') doesn\'t exist');
					return false;
				}
				
			}
		},
		_isArray: function(data){	// check the existence of the field
			
			if(isArray(this._data[data])){
				
				return true;
				
			}else{
				
				console.error('DataMind : The field ('+data+') is not an array');
				return false;
			}
		},
		_indexExists: function(data, index){
			
			if(this._data[data].length > index){
				
				return true;
				
			}else{
				
				console.error('DataMind : The index '+index+' doesn\'t belong to the array '+data+'.');
				return false;
			}
			
		},
		_isObject: function(data){
			
			if(typeof this._data[data] == 'object'){
				
				return true;
				
			}else{
				
				console.error('DataMind : The field ('+data+') is not an object');
				return false;
			}
		},
		_keyExists: function(data, key){
			
			if(key in this._data[data]){
				
				return true;
				
			}else{
				
				console.error('DataMind : The key '+key+' doesn\'t belong to the object '+data+'.');
				return false;
			}
		},
		_keyDoesNotExist: function(data, key){
			
			if(key in this._data[data]){
				
				console.error('DataMind : The key '+key+' already exists in the object '+data+'.');
				return true;
				
			}
			
			return false;
			
		},
		getAll: function(){
			
			var retour = {};
			
			for(var prop in this._data){
				
				retour[prop] = this._data[prop].getValue();
				
			}
			
			return retour;
			
		},
		get: function(data){
			
			if(this._checkField(data)){
				
				return this._data[data];
				
			}
			
			return false;
			
		},
		// arrays facilities
		push: function(data, value){
			
			if(this._checkField(data) && this._isArray(data)){
				
				// value added
				var //evName = data+'_add',
					evName = data+':add';
				
				this._launchEvent(evName, {
					way: 'push',
					newValue: value,
					index: this._data[data].length
				});
				
				this._data[data].push(value);
				return true;
			}
			
			return false;
			
		},
		unshift: function(data){
			
			if(this._checkField(data) && this._isArray(data)){
				
				// value added
				var //evName = data+'_add',
					evName = data+':add';

				this._launchEvent(evName, {
					way: 'unshift',
					newValue: value,
					index: 0
				});
				
				this._data[data].unshift(value);
				return true;
			}
			
			return false;
			
		},
		pop: function(data){
			
			if(this._checkField(data) && this._isArray(data)){
				
				// value removed
				var //evName = data+'_remove',
					evName = data+':remove';
				
				this._launchEvent(evName, {
					way: 'pop',
					newValue: this._data[data].pop(),
					index: this._data[data].length-1
				});
				
				return true;
			}
			
			return false;
			
		},
		shift: function(data){
			
			if(this._checkField(data) && this._isArray(data)){
				
				// value removed
				var evName = data+':remove';
				
				this._launchEvent(evName, {
					way: 'shift',
					lateValue: this._data[data].shift(),
					index: 0
				});
				
				return true;
			}
			
			return false;
			
		},
		removeAt: function(data, index){
			
			if(this._checkField(data) && this._isArray(data) && this._indexExists(data, index)){
				
				// value removed
				var //evName = data+'_remove',
					evName = data+':remove';
				
				this._launchEvent(evName, {
					way: 'removeat',
					lateValue: this._data[data][index],
					index: index
				});
				
				return arrayRemove(this._data[data], index, index);
				
			}
			
			return false;
			
		},
		getAt: function(data, index){
			
			if(this._checkField(data) && this._isArray(data) && this._indexExists(data, index)){
				
				return this._data[data][index];
				
			}
			
			return false;
			
		},
		updateAt: function(data, index, value){
			
			if(this._checkField(data) && this._isArray(data) && this._indexExists(data, index)){
				
				// value updated
				var //evName = data+'_update',
					evName = data+':update';
				
				this._launchEvent(evName, {
					lateValue: this._data[data][index],
					newValue: value,
					index: index
				});
				
				this._data[data][index] = value;
				return true;
			}
			
			return false;
			
		},
		// collections facilities
		addItem: function(data, key, value){
			
			if(this._checkField(data) && this._isObject(data) && this._keyDoesNotExist(data, key)){
				
				// item added
				var //evName = data+'_add',
					evName = data+':add';
				
				this._launchEvent(evName, {
					way: 'additem',
					newValue: value
				});
				
				this._data[data][key] = value;
				return true;
			}
			
			return false;
			
		},
		removeItem: function(data, key){
			
			if(this._checkField(data) && this._isObject(data) && this._keyExists(data, key)){
				
				// item removed
				var //evName = data+'_remove',
					evName = data+':remove';
				
				this._launchEvent(evName, {
					way: 'removeitem',
					lateValue: this._data[data][key]
				});
				
				this._data[data][key] = null;
				delete this._data[data][key];
				
				return true;
			}
			
			return false;
		},
		getItem: function(data, key){
			
			if(this._checkField(data) && this._isObject(data) && this._keyExists(data, key)){
				
				return this._data[data][key];
				
			}
			
			return false;
			
		}
	});
	
	/* Determine whether an object is an array. */
	function isArray(a){
		return (a && (($.browser.safari && typeof a == 'object' && a.length) ||
			(a.constructor && a.constructor.toString().match(/\Array\(\)/))));
	};
	
	function arrayRemove(array, from, to) {
		
		var rest = array.slice((to || from) + 1 || array.length);
		array.length = from < 0 ? array.length + from : from;
		return array.push.apply(array, rest);
		
	}
	
	function parseArguments(argumnts){
		
		var ev = argumnts[0];
		var otherArgs = Array.prototype.slice.call(argumnts, 1),
			args = {
				events: {},
				target: null,
				data: {}
			},
			tmpHandler = null;
		
		// parse arguments
		if(typeof ev == 'string'){
			
			switch(otherArgs.length){
				case 3:
					
					args.target = otherArgs[0];
					args.data = otherArgs[1];
					tmpHandler = otherArgs[2];
					
				break;
				case 2:
					
					if(typeof otherArgs[0] == 'string'){
						
						args.target = otherArgs[0];
						
					}else{
						
						args.data = otherArgs[0];
						
					}
					
					tmpHandler = otherArgs[1];
					
				break;
				case 1:
					
					// check that last argument is a function 
					if($.isFunction(otherArgs[0])){
						
						// in case of event subscription
						tmpHandler = otherArgs[0];
						
					}else{
						
						// in case of event removal
						args.target = otherArgs[0];
						
					}
					
				break;
			}
			
			ev = ev.split(' ');
			
			for(var i=ev.length-1;i>=0;--i){
				
				if(ev[i] != ''){
					args.events[ev[i].replace(/\./gi, '_')] = tmpHandler;
				}
			}
			
		}else{
			
			switch(otherArgs.length){
				case 2:
					
					args.target = otherArgs[0];
					args.data = otherArgs[1];
					
				break;
				case 1:
					if(typeof otherArgs[0] == 'string'){
						
						args.target = otherArgs[0];
						
					}else{
						
						args.data = otherArgs[0];
						
					}
					
				break;
			}
			
			var evs = {},
				evNames = null,
				evName = '',
				j = 0;
			
			for(var i in ev){
				
				evNames = i.replace(/\./gi, '_').split(' ');
				
				for(j=evNames.length-1;j>=0;--j){
					
					evName = evNames[j]
					
					if(evName != ''){
						
						evs[evName] = ev[i];
						
					}
				}
			}
			
			args.events = evs;
		}
		
		return args;
		
	}
	/*
	$.fn.dataOn = function(){
		
		if ( !this.length ) {
			return this;
		}
		
		var arg = arguments;
		
		return this.each(function(){
			$.datamind._onEvent($(this), parseArguments(arg));	// get the event arguments parsed
		});
		
	};
	
	$.fn.dataOff = function(){
		
		if ( !this.length ) {
			return this;
		}
		
		var arg = arguments;
		
		return this.each(function(){
			$.datamind._offEvent($(this), parseArguments(arg));	// get the event arguments parsed
		});
		
	};
	*/
	$.datamind = new DataMind(); // singleton instance
	$.datamind.uuid = new Date().getTime();
	
})(jQuery);
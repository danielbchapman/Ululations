
import osc from 'osc'
import { 
	critical,
	verbose,
	debug,
	warn,
} from './SimpleLog'
const TIME_OUT = 5000
const VERBOSE = false

const log = (str, args) => {
	verbose(str, args)
}
export const VERSIONS = {
	VERSION_1_0: 1.0,
	VERSION_1_1: 1.1,
}

export const formatOscMessageAsNormalPath = (message) => {
	if(!message) {
		return 'inavlid osc message: null or empty'
	}

	const copy = {
		address: message.address || '',
		args: message.args || [],
	}
	return `${copy.address} ${copy.args}`
}
/**
 * Construct an EosTcpHandler for OSC, it tries to make things
 * relatively synchronous and stores a state of information you
 * can read from.
 * 
 * You need to recreate this for each connection attempt due to some bugs 
 * in the OSC library.
 * 
 * @param {String} address the host
 * @param {Integer} port the port
 * @param {function<string> Log} onSend a logger fired on send
 * @param {function<string> Log} onReceive a logger fired on send
 * @param {function<Error>} onError when a critical error occurs it can abort
 * @param {function<string>} onVerbose a verbose logger for minor events
 */
class EosTcpHandler {

	constructor(address, port, version, onSend, onReceive, onError, onVerbose){
		const empty = ()=>{}
		const basic = (type) => {
			return (str, other) => {
				log('[' + type + '] ' + str, other)
			}
		}
		//PROPERTIES
		this._tcp = null
		this._listeners = []
		this.isConnected = false
		this.commandLine = ''
		this.address = ''
		this.port = ''
		this.version = VERSIONS.VERSION_1_0
		this.address = address
		this.port = port
		this.onVerbose = onVerbose || empty
		this.onError = onError || basic('error')
		this.onSend = onSend || basic('send')
		this.onReceive = onReceive || basic('receive')

		//Bind external functions
	}

	//Add a listener and return the index it is at
	addListener(listenerFn) {
		this._listeners.push(listenerFn)
		return this._listeners.length - 1 
	}

	removeListener(index) {
		this._listeners[index] = null
	}

	clearListeners() {
		this._listeners = []
	}

	isConnected() {
		return this._isConnected || false
	}
	
	disconnect() {
		this.onVerbose('OSC::disconnect')
		if(this._tcp) {
			this.isConnected = false
			this._tcp.close()
			this._tcp = null
		}
	}

	/** Returns a promise to that resolves when connected */
	connect() {
		let timeout = null
		let stack = this._listeners
		return new Promise( (resolve, reject) => {
			
			const version = this.version
			this.onVerbose('Connecting with Version ' + version)
			this._tcp = new osc.TCPSocketPort({
				address: this.address,
				port: this.port,
				//useSLIP: version == VERSIONS.VERSION_1_1 ? true : false
			})

			this.onVerbose('SLIP? ' + this._tcp.options.useSLIP)
	
			// this._tcp.on('osc', (packet) => {
			// 		log('----osc')
			// 		log(packet)
			// })

			this._tcp.on('message', (message) => {
				this.onVerbose('OSC Message Received')
				this.onVerbose('OSC Timeout:' + timeout !== null)
				this.onReceive( formatOscMessageAsNormalPath(message) )
				
				if(	timeout 
						&& message.address 
						&& message.address.includes('/eos/out')
				) {
					this.onVerbose('Eos Message Received, clearing timeout')
					clearTimeout(timeout)
					timeout = null;
					this.isConnected = true
					this.onReceive('OSC PACKET RECEIVED, CONNECTED to ETC Eos')
					resolve('OSC PACKET RECEIVED, CONNECTED to ETC Eos')
				} 

				let count = 0;
				for(let listener of stack) {
					if(listener && typeof listener === 'function') {
						this.onVerbose('sending to listener ' + count++)
						listener(message)
					}
				}
			})


			// this._tcp.on('data2', (buf) => {
			// 	log('data')
			// 	//log(buf)
			// 	let decoded = null

			// 	if(version == 1.0)
			// 	{
			// 		log("decode 1.0")
			// 		const trimmed = buf.buffer.slice(buf.byteOffset + 4, buf.byteOffset + buf.byteLength)
			// 		decoded = this._tcp.decodeSLIPData(buf)					
			// 		log(decoded)
			// 	}
			// 	else //VERSION 1.1
			// 	{
			// 		log("decode 1.1")
			// 		decoded = this._tcp.decodeSLIPData(buf)
			// 		log(buf.toString())
			// 		log('decoded-> ' + decoded)
			// 	}


			// 	//check for ping
			// 	if(timeout && decoded) { //data came back
			// 		clearTimeout(timeout)
			// 		timeout = null;
			// 		this.isConnected = true
			// 		resolve('PING RECEIVED, CONNECTED = TRUE')
			// 	}
			// })
	
			this._tcp.on('ready', ()=>{
				this.onVerbose('EosTcpHandler::OSC::ready')
				//DELAY and wait for a result

				timeout = setTimeout(()=>{
					this.onVerbose(`The EOS Console did not respond within ${TIME_OUT / 1000} seconds from the ping request. Check your address, OSC Version, and try again.`)
					this.onError(`The EOS Console did not respond within ${TIME_OUT / 1000} seconds from the ping request. Check your address, OSC Version, and try again.`)
					reject(`The EOS Console did not respond within ${TIME_OUT / 1000} seconds from the ping request. Check your address, OSC Version, and try again.`)
				}, TIME_OUT)

				this.send('/eos/ping', 'lightassistant')
			})

			this._tcp.on('error', (error) => {
				//ERROR HANDLING!

				if( (''+error).includes(`The header of an OSC packet`) ) {
					this.onVerbose('[OSC] Version Error | Wrong OSC Version, Expected ' + (version == VERSIONS.VERSION_1_0 ? '1.0' : '1.1' ))
					this.onError( (''+error).split('\\n')[0])
					//log('[OSC] Version Error | Wrong OSC Version, Expected ' + (version == VERSIONS.VERSION_1_0 ? '1.0' : '1.1' ))
					//log(error)
					return
				}

				if(!error.code) {
					this.onVerbose('[OSC] UNKNOWN ERROR, probably a bug in the library, disregard ')
					critical(error)
					return
				}

				//Console output, hard coded
				log('----------OSC ERROR---------')
				log(`code: ${error.code}`)
				log(`syscall: ${error.syscall}`)
				log(`address: ${error.address}`)
				log(`port: ${error.port}`)
				log(error)
				log('----------END ERROR---------')

				if('ECONNREFUSED' == error.code) {
					this.onError('Connecttion Refused')
					this.onVerbose('Connection Refused')
					reject(error)
					log('OSC ECONNREFUSED')
					log(error)
					// this._tcp.close()
					// this._tcp = null
				}
				//else continue despite errors
			})

			if(this.version == VERSIONS.VERSION_1_0)
			{
				this._tcp.on('data', (buf)=>{
					//log('data -> ' + buf)
					const trimmed = buf.buffer.slice(buf.byteOffset + 4, buf.byteOffset + buf.byteLength)
					const decoded = this._tcp.decodeOSC(trimmed) //this calls a listener to process it.
				})
			}

			try{
				this.onVerbose('opening connection ');
				this._tcp.open()
			} catch (error) {
				this.onVerbose('Connection Failed')
				this.onError(error)
				reject(error)
			}
		})
	}

	toString() {
		return `
address: ${this.address}
port: ${this.port}
isConnected: ${this.isConnected}
commandLine: ${this.commandLine}
		`
	}

	send(address, args = []) {
		if(!this._tcp) {
			critical('OSC-MODULE - ERROR>> TCP SOCKET NULL')
			return
		}
		//log('EosTcpHandler::send::info::VERSION -> ' + this.version)
		const message = {
			address: address,
			args: args
		}
		const version1 = this.version == VERSIONS.VERSION_1_0
		this.onSend( formatOscMessageAsNormalPath(message) )
		if(!version1) { //SLIP 1.1
			
			this._tcp.send(message)
		} else { //Packet Length Encoding
			log('EosTcpHandler::send::info Version 1 packet', message)
			let encoded = this._tcp.encodeOSC(message)
			encoded = encoded.slice(1, encoded.length - 1)//remove SLIP encoding 
			//log('encoded -> ' + encoded)
			var dv = new DataView(new ArrayBuffer(encoded.length + 4))
			dv.setInt32(0, encoded.length, false /*Big Endian*/)
	
			for(let i = 0; i < encoded.length; i++) {
				dv.setUint8(i +4 , encoded[i])
			}
			//log(dv.buffer.toString())
	
			// if (onSend) {
			// 	onSend(message)
			// }
	
			this._tcp.sendRaw(dv.buffer)//trim the bad character
		}
	}

}

export default EosTcpHandler
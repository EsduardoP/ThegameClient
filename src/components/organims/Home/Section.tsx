import { useState, useEffect } from "react";
import iconGoogle from '../../../assets/img/icon-google.png';
import userPicture from '../../../assets/img/user.jpg';
import { IonIcon } from '@ionic/react';
import { logoFacebook } from 'ionicons/icons';
import fullHeart from '../../../assets/svg/full-heart.svg'
import PlusSignComponent from "../../atoms/PlusSign";
import Scroll from "../../atoms/scroll";

interface Jugador {
    id:string;
    name: string;
    score: number;
    lives: number;
    level: number;
}

const SectionHome = () => {
    const [allJugadores, setAllJugadores] = useState<Jugador[]>([]);
    const [allJugadoresRecientes, setAllJugadoresRecientes] = useState<Jugador[]>([]);
    const [connectedPlayers, setConnectedPlayers] = useState<string[]>([]);
    const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(true);
    const [isKeyPressed, setIsKeyPressed] = useState<Record<string, boolean>>({});
    const [audioRefs, setAudioRefs] = useState<Record<string, HTMLAudioElement>>({});
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [count, setCount] = useState<number | string>('');
    const [pressedKeys, setPressedKeys] = useState<string[]>([]);
    const [maxKeysAllowed, setMaxKeysAllowed] = useState(0);
    const [currentLives, setCurrentLives] = useState(0);
    const [gameStarted, setGameStarted] = useState(false); 

    // Nuevo jugador al entrar
    const [nickname, setNickname] = useState('');
    const [passwd, setPasswd] = useState('');
    const [nicknameError, setNicknameError] = useState('');
    const [passwdError, setPasswdError] = useState('');

    const handleInputNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (/\s/.test(value)) {
            setNicknameError('El nombre de usuario no debe contener espacios.');
        } else {
            setNicknameError('');
        }
        setNickname(value);
    };

    const handleInputPasswdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (value.length < 5) {
            setPasswdError('La contraseña debe tener al menos 5 caracteres.');
        } else {
            setPasswdError('');
        }
        setPasswd(value);
    };

    const Entrar = () => {
        handleSubmit();
    };  

    const handleSubmit = () => {
        if (!nickname.trim() || nicknameError || passwdError) {
            alert('Por favor, corrige los errores antes de enviar.');
            return;
        }
        else{
            iniciar()
        }
    };
    const iniciar = () => {
        function requestNickname() {
            const newSocket = new WebSocket("ws://localhost:3000/");
            const all = new EventSource("http://localhost:3000/all")
            newSocket.onopen = () => {
                newSocket.send(JSON.stringify({ type: "player", nickname, passwd })); 
                newSocket.send(JSON.stringify({ action: "connectedPlayers" }));
            };

            newSocket.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'reconnect':
                    case 'register':
                    default:
                        setIsNicknameModalOpen(false);

                        if (data.event === "connectedPlayers") {
                            const names = data.data.map((player: { name: string }) => player.name); 
                            jugadoresOnline(names);
                        }
                       
                        switch (data.event) {
                            case "connectedPlayers":
                                newSocket.send(JSON.stringify({ action: "lives" }));
                                break;
                            case "startGaming":
                                const teclas = data.data;
                                setMaxKeysAllowed(teclas.length);
                                go(teclas)
                                break;
                            case "lives":
                                if (data.data.lives > 0) {
                                    setCurrentLives(data.data.lives)
                                }
                                break;
                            case "lives-":
                                setCurrentLives(data.data.lives)
                                break;    
                        }
                        break;
                    case 'error':
                        console.log(data.message);
                        alert("nombre de usuario o contraseña incorrecto")
                        break;
                }
            };



            newSocket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            newSocket.onclose = () => {
                console.log('WebSocket connection closed');
            };
            // SSE
            all.addEventListener("infoPlayer", function(event) {
                const infoPlayer = JSON.parse(event.data);
                mostrarScore(infoPlayer);
                mostrarJugadores(infoPlayer);
                mostrarJugadoresRecent(infoPlayer)
            });
    
            setSocket(newSocket);
        }

    
        function jugadoresOnline(names: string[]) {
            setConnectedPlayers(names);
        }
    
        // Iniciar el proceso solicitando el apodo
        requestNickname();
    };
    


    function startGaming() {
        if (socket) {
            socket.send(JSON.stringify({ action: "startGaming" }));
        }
    }

    function go(teclas: string[]) {
        const delay = 1000;
        let index = 0;
    
        const intervalId = setInterval(() => {
            if (teclas && index >= teclas.length) {
                clearInterval(intervalId);
                setCount('Tu turno!');
                setTimeout(() => {
                    setCount('');
                }, 1100);
                return;
            }
            if (teclas && teclas.length > 0) {
                const key = teclas[index];
                setCount(String(key));
                if (audioRefs[key]) {
                    audioRefs[key].currentTime = 0;
                    audioRefs[key].play();
                }
            }
    
            index++;
        }, delay);
    }

    function handlePlayButton(){
        const selectedKeys = ["f", "x", "+", "h"];
        const delay = 120;
        let index = 0;
        const intervalId = setInterval(() => {
            if (index >= selectedKeys.length) {
                clearInterval(intervalId);
                setGameStarted(true); // Marca el juego como iniciado
                return;
            }
            const key = selectedKeys[index];
            if (audioRefs[key]) {
                audioRefs[key].currentTime = 0;
                audioRefs[key].play();
            }
            index++;
        }, delay);
        cuentaRegresiva();
    }
    
    function cuentaRegresiva(){
        let currentCount = 3; // Número inicial para la cuenta regresiva
        setCount(currentCount);
    
        const countdownInterval = setInterval(() => {
            currentCount--;
            if (currentCount > 0) {
            setCount(currentCount);
            } else if (currentCount === 0) {
            setCount('Escucha!');
            setTimeout(() => {
                setCount(''); // Limpiar el texto después de "Go!"
                clearInterval(countdownInterval); // Limpiar el intervalo
                startGaming()// Llama a la función para iniciar el juego
            }, 1000); // Espera 1 segundo antes de limpiar el texto y empezar el juego
            }
        }, 1200); // Intervalo de 1 segundo
    }



    useEffect(() => {
        const jugadoresConectadosRecientes = allJugadoresRecientes.filter(jugador => connectedPlayers.includes(jugador.name));
        if (jugadoresConectadosRecientes.length > 0) {
            //setBandera(true)
        } else {
            //console.log("No se encontraron jugadores recientes que estén conectados.");
        }
    }, [allJugadoresRecientes, connectedPlayers]);

    const loadAudio = () => {
        const audioFiles: { [key: string]: Promise<typeof import("*.mp3")> } = {
            'q': import('../../../assets/songs/c2.mp3'),
             '2': import('../../../assets/songs/c_2.mp3'),
            'w': import('../../../assets/songs/d2.wav'),
             '3': import('../../../assets/songs/d_2.wav'),
            'e': import('../../../assets/songs/e2.wav'),
            'r': import('../../../assets/songs/f2.wav'),
             '5': import('../../../assets/songs/f_2.wav'),
            't': import('../../../assets/songs/g2.wav'),
             '6': import('../../../assets/songs/g_2.wav'),
            'y': import('../../../assets/songs/a2.wav'),
             '7': import('../../../assets/songs/a_2.wav'),
            'u': import('../../../assets/songs/b2.wav'),

            'i': import('../../../assets/songs/c3.mp3'),
            '9': import('../../../assets/songs/c_3.mp3'),
            'o': import('../../../assets/songs/d3.mp3'),
            '0': import('../../../assets/songs/d_3.mp3'),
            'p': import('../../../assets/songs/e3.mp3'),
            '+': import('../../../assets/songs/f3.mp3'),
            'a': import('../../../assets/songs/f_3.mp3'),
            'z': import('../../../assets/songs/g3.mp3'),
            's': import('../../../assets/songs/g_3.mp3'),
            'x': import('../../../assets/songs/a3.mp3'),
            'd': import('../../../assets/songs/a_3.mp3'),
            'c': import('../../../assets/songs/b3.mp3'),

            'f': import('../../../assets/songs/c4.wav'),
            'v': import('../../../assets/songs/c_4.wav'),
            'g': import('../../../assets/songs/d4.wav'),
            'b': import('../../../assets/songs/d_4.wav'),
            'h': import('../../../assets/songs/e4.wav'),
            'n': import('../../../assets/songs/f4.wav'),
            'j': import('../../../assets/songs/f_4.wav'),
            'm': import('../../../assets/songs/g4.wav'),
            'k': import('../../../assets/songs/g_4.wav'),
            ',': import('../../../assets/songs/a4.wav'),
            'l': import('../../../assets/songs/a_4.wav'),
            '.': import('../../../assets/songs/b4.wav'),

            '-': import('../../../assets/songs/c5.wav'),
        };

        const refs: Record<string, HTMLAudioElement> = {};

        for (const key in audioFiles) {
            audioFiles[key].then(audioModule => {
                const audioUrl = audioModule.default;
                const audioElement = new Audio(audioUrl);
                refs[key] = audioElement;
            });
        }

        setAudioRefs(refs);
    };

    useEffect(() => {
        loadAudio();
    }, []);


    function handleKey(keyValue: string){
        if (!gameStarted || pressedKeys.length >= maxKeysAllowed) {
            return;
        }

        //console.log(`Tecla presionada: ${keyValue}`);

        let keysSent = false;

        // Actualiza el estado de las teclas presionadas
        setPressedKeys(prevKeys => {
            const updatedKeys = [...prevKeys, keyValue];

            // Actualiza el estado de las teclas presionadas
            setIsKeyPressed(prevState => ({ ...prevState, [keyValue]: true }));

            if (audioRefs[keyValue]) {
                audioRefs[keyValue].currentTime = 0;
                audioRefs[keyValue].play();
            }

            // Restablece el estado de la tecla presionada después de 300 ms
            setTimeout(() => {
                setIsKeyPressed(prevState => ({ ...prevState, [keyValue]: false }));
            }, 300);

            // Envía las teclas al servidor si se ha alcanzado el número máximo permitido
            if (updatedKeys.length >= maxKeysAllowed && !keysSent) {
                setTimeout(() => {
                    sendKeysToServer(updatedKeys);
                    setPressedKeys([]); // Limpiar las teclas presionadas después de enviarlas
                }, 500); // Retraso de medio segundo (ajustable según sea necesario)

                // Establece la bandera a true para indicar que las teclas se han enviado
                keysSent = true;
            }

            return updatedKeys;
        });
    }

    function handlePianoKeyClick(e: React.MouseEvent) {
        if ((e.target as HTMLElement).tagName === 'LI') {
            const keyValue = (e.target as HTMLElement).dataset.key!;
            handleKey(keyValue);
        }
    }

    function sendKeysToServer(keys: string[]) {
        if (socket) {
            socket.send(JSON.stringify({ action: "checKeys", keys }));
            setPressedKeys([]);
        }
    }




    const mostrarScore = (jugadores: Jugador[]) => {
        setAllJugadores(jugadores);
    };
    function mostrarJugadores(jugadores: Jugador[], ){
        jugadores.forEach((_jugador) => {
            setAllJugadoresRecientes(jugadores);
        });
    }
    async function mostrarJugadoresRecent(jugador:Jugador) {
        setAllJugadoresRecientes((prevJugadores) => {
            const exists = prevJugadores.some((j) => j.id === jugador.id);
            if (!exists) {
                return [...prevJugadores, jugador];
            }
            return prevJugadores;
        });
    }



    useEffect(() => {
        const getRandomColor = () => {
          const r = Math.floor(Math.random() * 128);
          const g = Math.floor(Math.random() * 128);
          const b = Math.floor(Math.random() * 128);
          return `rgb(${r}, ${g}, ${b})`;
        };
    [...allJugadoresRecientes, ...allJugadores].forEach((jugador) => {
        const element = document.getElementById(`player-score-${jugador.name}`);
        if (element) {
        element.style.backgroundColor = getRandomColor();
        }
    });
}, [allJugadoresRecientes, allJugadores]);

    return(
        <section className="section-login">
            {isNicknameModalOpen && (
                <div className="divModal">
                    <div className="divStyle">
                        <h2 className="titleStyle">Melodiano.io</h2>
                        <input
                            className={`inputStyle ${nicknameError ? 'error' : ''}`}
                            type="text"
                            placeholder="Apodo"
                            value={nickname}
                            onChange={handleInputNicknameChange}
                        />
                        {nicknameError && <p style={{ color: 'red', marginTop:'13px', marginBottom:'-5px', fontSize:'12px', fontWeight:'700' }}>{nicknameError}</p>}

                        <input
                            className={`inputStyleP ${passwdError ? 'error' : ''}`}
                            type="password"
                            placeholder="Contraseña"
                            value={passwd}
                            onChange={handleInputPasswdChange}
                        />
                        {passwdError && <p style={{ color: 'red', marginTop:'4px', marginBottom:'-5px', fontSize:'12px', fontWeight:'700' }}>{passwdError}</p>}

                        <button className="entrarStyle" onClick={Entrar}>Play</button>
                        <div className="social-networks">
                            <button className="red-f"><IonIcon icon={logoFacebook} /><div>Sign In</div></button>
                            <button className="red-g"> <img src={iconGoogle}/><div>Sign In</div></button>
                        </div>
                        <h5>
                            Recuerda las vidas se completaran en 24h!
                        </h5>
                    </div>
                </div>
            )}

            <div className="players-online">
                <h2 className="title">Tabla de clasificación</h2>
                <div className="list">
                    
                </div>
            </div>

            <div className="game">
                <div className="level-container">
                    <div className="izquierdo"/>
                    <div className="level">
                        Dificultad: facil
                    </div>
                    <div className="derecho"/>
                </div>

                <div id="countdown" className="contador">{count}</div>
                
                    <div className="wrapper">

                        <ul className="piano-keys" onClick={handlePianoKeyClick}>
                            <li
                                className={`key white ${isKeyPressed['i'] ? 'pressed' : ''}`} // Clase condicional
                                data-key="i"><span>i</span></li>                      
                            <li 
                                className={`key black ${isKeyPressed['9'] ? 'pressed' : ''}`}
                                data-key="9"><span>9</span></li>
                            <li 
                                className={`key white ${isKeyPressed['o'] ? 'pressed' : ''}`}
                                data-key="o"><span>o</span></li>
                            <li 
                                className={`key black ${isKeyPressed['0'] ? 'pressed' : ''}`}
                                data-key="0"><span>0</span></li>
                            <li 
                                className={`key white ${isKeyPressed['p'] ? 'pressed' : ''}`} 
                                data-key="p"><span>p</span></li>
                            <li 
                                className={`key white ${isKeyPressed['+'] ? 'pressed' : ''}`}
                                data-key="+"><span>+</span></li>
                            <li 
                                className={`key black ${isKeyPressed['a'] ? 'pressed' : ''}`}
                                data-key="a"><span>a</span></li>
                            <li 
                                className={`key white ${isKeyPressed['z'] ? 'pressed' : ''}`} 
                                data-key="z"><span>z</span></li>
                            <li 
                                className={`key black ${isKeyPressed['s'] ? 'pressed' : ''}`}
                                data-key="s"><span>s</span></li>
                            <li 
                                className={`key white ${isKeyPressed['x'] ? 'pressed' : ''}`}
                                data-key="x"><span>x</span></li>
                            <li 
                                className={`key black ${isKeyPressed['d'] ? 'pressed' : ''}`}
                                data-key="d"><span>d</span></li>
                            <li 
                                className={`key white ${isKeyPressed['c'] ? 'pressed' : ''}`}
                                data-key="c"><span>c</span></li>



                            <li
                                className={`key white ${isKeyPressed['f'] ? 'pressed' : ''}`} // Clase condicional
                                data-key="f"><span>f</span></li>                    

                            
                        </ul>
                    </div>
                    <div className="start-content">
                        <div className="start-game" onClick={handlePlayButton}>
                            {/* <div className="triangulo"/> */}
                            PLAY
                        </div>
                    </div>
            </div>

            <div className="lives-players">
                <div className="lives">
                    <div className="content-tempo">
                        <div className="tempo">
                            Lleno
                        </div>
                    </div>
                    <PlusSignComponent vidas={currentLives} ><object data={fullHeart} type="image/svg+xml"/></PlusSignComponent>
                </div>
                <Scroll>
                    {[...allJugadoresRecientes, ...allJugadores]
                        .filter((jugador, index, self) => index === self.findIndex(j => j.name === jugador.name))
                        .sort((a, b) => {
                            const aIsOnline = connectedPlayers.includes(a.name);
                            const bIsOnline = connectedPlayers.includes(b.name);

                            if (aIsOnline && !bIsOnline) {
                                return -1;
                            }
                            if (!aIsOnline && bIsOnline) {
                                return 1;
                            }
                            return a.name.localeCompare(b.name);
                        })
                        .map((jugador) => (
                            <div key={jugador.name} className="player-score" id={`player-score-${jugador.name}`}>
                                <div className="profile-picture">
                                    <img src={userPicture} alt="Foto de perfil" />
                                </div>
                                <div className="profile-info">
                                    <h3>{jugador.name}</h3>
                                    {connectedPlayers.includes(jugador.name) ? (
                                        <span className="on">En línea</span>
                                    ) : (
                                        <span>Offline</span>
                                    )}
                                </div>
                                {!connectedPlayers.includes(jugador.name) && (
                                    <div className="overlay"></div>
                                )}
                            </div>
                        ))
                    }
                </Scroll>
            </div>
        </section> 
    )
};
export default SectionHome;
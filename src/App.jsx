import {useState, useEffect} from 'react'
import './App.css'
import generateAnswer from './components/GPT3_API.jsx';
import RecordVoice from "./components/RecordVoice.jsx";
import ChatComponent from "./components/ChatComponent.jsx";
import {useSpring, animated} from 'react-spring';

function AnimatedAvatar() {
    const styles = useSpring({
        to: {transform: 'rotate(360deg)'},
        from: {transform: 'rotate(0deg)'},
        config: {duration: 1000},
        loop: true,
    });

    return (
        <animated.img
            src="./head.png"
            height={'80%'}

            alt="avatar"
            // style={styles}
        />
    );
}


const App = () => {

    return (
        <div class="bg-gray-900 w-full h-full">
            {/*<AnimatedAvatar />*/}
            <RecordVoice/>
            {/*<ChatComponent/>*/}
            {/*<div className={'Logo'}/>*/}


        </div>
    );
};

export default App;


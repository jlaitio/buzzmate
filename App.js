/**
 * @format
 * @flow
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Dimensions,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import {
  LineChart,
} from "react-native-chart-kit";

import MicStream from 'react-native-recording';
import _ from 'lodash';

import { fft, util as fftUtil } from 'fft-js';

import {useInterval} from './util';

import {PermissionsAndroid} from 'react-native';

async function requestMicPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Cool Photo App Camera Permission',
        message:
          'Cool Photo App needs access to your camera ' +
          'so you can take awesome pictures.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('You can use the camera');
    } else {
      console.log('Camera permission denied');
    }
  } catch (err) {
    console.warn(err);
  }
}

var micData = [];


const App: () => React$Node = () => {
  const [val, setVal] = useState([1,0,1,0]);

  const listener = useRef(null);

  useInterval(() => {
    micData = [];
  }, 5000);

  useEffect(() => {
    requestMicPermission();
    MicStream.init({
      bufferSize: 2048,
      sampleRate: 44100,
      bitsPerChannel: 16,
      channelsPerFrame: 1,
    });
    MicStream.start();

    listener.current = MicStream.addRecordingEventListener(data => {
      setVal(data);
      micData.push(data);
    });
  }, [])

  useEffect(
    () => () => {
      MicStream.stop();
      listener.current.remove();
    },
    [],
  );

  const waveFormValues = _.chunk(val, val.length/32).map(c => _.mean(c) + 65535/2);

  const phasors = fft(val);

  //const frequencies = fftUtil.fftFreq(phasors, 44100)
  const magnitudes = fftUtil.fftMag(phasors);

  const spectrumValues = _.chunk(magnitudes, magnitudes.length/32).map(c => _.mean(c));

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Test values from mic</Text>
              <Text style={styles.sectionDescription}>
                {val ? [_.max(val), _.min(val)].join(',') : ''}
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Waveform</Text>
              <SimpleBarChart values={waveFormValues} max={65535} />
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Spectrum</Text>
              <SimpleBarChart values={spectrumValues} max={_.max(spectrumValues)} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const SimpleBarChart = (props) => {
  const {
    values,
    max
  } = props;

  return (
    <View style={{height: 200, flex: 1, flexDirection: 'row', backgroundColor: 'white', alignItems: 'flex-end'}}>
      {values.map((v, i) => (
        <View key={'bar_chart_x_'+i} style={{height: (((v*1.0) / max) * 200) || 0, backgroundColor: 'grey', flex: 1}}></View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;

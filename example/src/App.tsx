import * as React from 'react';
import { Dimensions, Platform, SafeAreaView, StyleSheet, Text } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { DBRConfig, decode, TextResult } from 'vision-camera-dynamsoft-barcode-reader';
import * as REA from 'react-native-reanimated';
import { Polygon, Svg } from 'react-native-svg';

export default function App() {
  const [hasPermission, setHasPermission] = React.useState(false);
  const [barcodeResults, setBarcodeResults] = React.useState([] as TextResult[]);
  const [frameWidth, setFrameWidth] = React.useState(720);
  const [frameHeight, setFrameHeight] = React.useState(1280);
  const devices = useCameraDevices();
  const device = devices.back;
  
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    const config:DBRConfig = {};
    //config.template="{\"ImageParameter\":{\"BarcodeFormatIds\":[\"BF_ONED\"],\"Description\":\"\",\"Name\":\"Settings\"},\"Version\":\"3.0\"}";
    config.rotateImage = true;
    const results:TextResult[] = decode(frame,config)
    
    console.log("height: "+frame.height);
    console.log("width: "+frame.width);
    
    REA.runOnJS(setBarcodeResults)(results);
    REA.runOnJS(setFrameWidth)(frame.width);
    REA.runOnJS(setFrameHeight)(frame.height);
  }, [])

  const getPointsData = (lr:TextResult) => {
    var pointsData = lr.x1 + "," + lr.y1 + " ";
    pointsData = pointsData+lr.x2 + "," + lr.y2 +" ";
    pointsData = pointsData+lr.x3 + "," + lr.y3 +" ";
    pointsData = pointsData+lr.x4 + "," + lr.y4;
    return pointsData;
  }

  const getViewBox = () => {
    const frameSize = getFrameSize();
    const viewBox = "0 0 "+frameSize[0]+" "+frameSize[1];
    console.log("viewBox"+viewBox);
    return viewBox;
  }

  const getFrameSize = ():number[] => {
    let width:number, height:number;
    if (Platform.OS === 'android') {
      if (frameWidth>frameHeight && Dimensions.get('window').width>Dimensions.get('window').height){
        width = frameWidth;
        height = frameHeight;
      }else {
        console.log("Has rotation");
        width = frameHeight;
        height = frameWidth;
      }
    } else {
      width = frameWidth;
      height = frameHeight;
    }
    return [width, height];
  } 

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  return (
      <SafeAreaView style={styles.container}>
        {device != null &&
        hasPermission && (
        <>
            <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            frameProcessor={frameProcessor}
            frameProcessorFps={5}
            />
            {barcodeResults.map((barcode, idx) => (
            <Text key={idx} style={styles.barcodeText}>
                {barcode.barcodeFormat +": "+ barcode.barcodeText}
            </Text>
            ))}
        </>)}
        <Svg style={[StyleSheet.absoluteFill]} viewBox={getViewBox()}>

          {barcodeResults.map((barcode, idx) => (
            <Polygon key={idx}
            points={getPointsData(barcode)}
            fill="lime"
            stroke="green"
            opacity="0.5"
            strokeWidth="1"
          />
          ))}
          
        </Svg>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1
  },
  barcodeText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
});

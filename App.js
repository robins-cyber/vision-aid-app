import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, Pressable, Switch, Alert, Vibration } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";
import { StatusBar } from "expo-status-bar";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";

const TensorCamera = cameraWithTensors(CameraView);
const INPUT_SIZE = 300;
const MIN_SCORE = 0.60;
const ANNOUNCE_COOLDOWN = 3500;

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [voice, setVoice] = useState(true);
  const [vibrate, setVibrate] = useState(true);
  const [lastObject, setLastObject] = useState("—");
  const [status, setStatus] = useState("Loading AI model…");
  const lastSpoken = useRef({});
  const busy = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await tf.ready();
        const m = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        if (alive) {
          setModel(m);
          setLoading(false);
          setStatus("AI ready");
        }
      } catch (e) {
        setLoading(false);
        setStatus("Model failed to load");
        Alert.alert("AI model error", String(e?.message || e));
      }
    })();
    return () => { alive = false; };
  }, []);

  const announce = (label, score) => {
    const now = Date.now();
    if (lastSpoken.current[label] && now - lastSpoken.current[label] < ANNOUNCE_COOLDOWN) return;
    lastSpoken.current[label] = now;
    setLastObject(`${label} (${Math.round(score * 100)}%)`);
    if (vibrate) Vibration.vibrate(120);
    if (voice) {
      Speech.stop();
      Speech.speak(label, {
        language: "en-IN",
        rate: 0.9,
        pitch: 1.0
      });
    }
  };

  const handleImages = async (images) => {
    if (!model || !running || busy.current) return;
    busy.current = true;
    try {
      const imageTensor = images.next().value;
      if (imageTensor) {
        const predictions = await model.detect(imageTensor);
        tf.dispose(imageTensor);
        const best = predictions
          .filter(p => p.score >= MIN_SCORE)
          .sort((a,b) => b.score - a.score)[0];
        if (best) announce(best.class, best.score);
      }
    } catch (e) {
      // Keep the live loop running even if one frame fails.
    } finally {
      busy.current = false;
    }
  };

  if (!permission) return <View style={styles.center}><Text style={styles.big}>Starting…</Text></View>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
        <Text style={styles.title}>VISION AID</Text>
        <Text style={styles.info}>Camera permission is required for object detection.</Text>
        <Pressable style={styles.primary} onPress={requestPermission}>
          <Text style={styles.primaryText}>ALLOW CAMERA</Text>
        </Pressable>
      </View>
    );
  }

  if (loading || !model) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
        <Text style={styles.title}>VISION AID</Text>
        <Text style={styles.info}>{status}</Text>
        <Text style={styles.small}>First launch may take a little longer while the AI model loads.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>VISION AID</Text>
        <Text style={styles.status}>{running ? "● DETECTING" : "● READY"}</Text>
      </View>

      <View style={styles.cameraBox}>
        {running ? (
          <TensorCamera
            style={styles.camera}
            type="back"
            cameraTextureHeight={1920}
            cameraTextureWidth={1080}
            resizeHeight={INPUT_SIZE}
            resizeWidth={INPUT_SIZE}
            resizeDepth={3}
            onReady={handleImages}
            autorender
          />
        ) : (
          <View style={styles.cameraOff}>
            <Text style={styles.cameraIcon}>◉</Text>
            <Text style={styles.info}>Press START DETECTION</Text>
          </View>
        )}
      </View>

      <View style={styles.result}>
        <Text style={styles.label}>LAST DETECTED</Text>
        <Text style={styles.object}>{lastObject}</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.row}>
          <Text style={styles.controlText}>Voice alert</Text>
          <Switch value={voice} onValueChange={setVoice} />
        </View>
        <View style={styles.row}>
          <Text style={styles.controlText}>Vibration</Text>
          <Switch value={vibrate} onValueChange={setVibrate} />
        </View>
      </View>

      <Pressable
        style={[styles.primary, running && styles.stop]}
        onPress={() => {
          setRunning(v => !v);
          if (running) Speech.stop();
        }}
      >
        <Text style={styles.primaryText}>{running ? "STOP DETECTION" : "START DETECTION"}</Text>
      </Pressable>

      <Text style={styles.footer}>
        Bluetooth audio follows the phone's selected audio output. Connect your Bluetooth earphone/speaker before starting.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:"#101216",padding:18},
  center:{flex:1,backgroundColor:"#101216",alignItems:"center",justifyContent:"center",padding:28},
  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:12},
  title:{fontSize:28,fontWeight:"800",color:"#fff",letterSpacing:2},
  status:{fontSize:12,color:"#7ee787",fontWeight:"700"},
  cameraBox:{height:"45%",borderRadius:18,overflow:"hidden",backgroundColor:"#20242c"},
  camera:{flex:1},
  cameraOff:{flex:1,alignItems:"center",justifyContent:"center"},
  cameraIcon:{fontSize:56,color:"#777",marginBottom:10},
  info:{fontSize:16,color:"#ddd",textAlign:"center",lineHeight:24},
  small:{fontSize:12,color:"#888",textAlign:"center",marginTop:14},
  big:{fontSize:18,color:"#fff"},
  result:{paddingVertical:18},
  label:{fontSize:11,color:"#888",letterSpacing:2},
  object:{fontSize:30,fontWeight:"700",color:"#fff",marginTop:5},
  controls:{borderTopWidth:1,borderBottomWidth:1,borderColor:"#292e38",paddingVertical:8,marginBottom:16},
  row:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:8},
  controlText:{fontSize:16,color:"#eee"},
  primary:{backgroundColor:"#fff",paddingVertical:16,borderRadius:14,alignItems:"center"},
  stop:{backgroundColor:"#d9534f"},
  primaryText:{fontSize:15,fontWeight:"800",color:"#111"},
  footer:{fontSize:11,color:"#777",textAlign:"center",marginTop:12,lineHeight:17}
});

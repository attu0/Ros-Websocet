import { useEffect, useRef, useState } from "react";
import ROSLIB from "roslib";

export default function App() {
  const rosRef = useRef(null);
  const cmdVelRef = useRef(null);
  const imageTopicRef = useRef(null);

  const [imageSrc, setImageSrc] = useState("");

  /* ---------- ROS CONNECTION ---------- */
  useEffect(() => {
    const ros = new ROSLIB.Ros({
      url: "ws://localhost:9090",
    });

    ros.on("connection", () => console.log("Connected to rosbridge"));
    ros.on("error", (err) => console.log("Error:", err));
    ros.on("close", () => console.log("Closed"));

    rosRef.current = ros;

    /* ---------- CMD_VEL ---------- */
    cmdVelRef.current = new ROSLIB.Topic({
      ros: ros,
      name: "/cmd_vel",
      messageType: "geometry_msgs/Twist",
    });

    /* ---------- CAMERA ---------- */
    imageTopicRef.current = new ROSLIB.Topic({
      ros: ros,
      name: "/camera/camera/image_raw/compressed",
      messageType: "sensor_msgs/CompressedImage",
    });

    imageTopicRef.current.subscribe((msg) => {
      setImageSrc(`data:image/jpeg;base64,${msg.data}`);
    });

    return () => {
      imageTopicRef.current.unsubscribe();
      ros.close();
    };
  }, []);

  /* ---------- CONTROL ---------- */
  const publish = (linearX, angularZ) => {
    if (!cmdVelRef.current) return;

    const twist = new ROSLIB.Message({
      linear: { x: linearX, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angularZ },
    });

    cmdVelRef.current.publish(twist);
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial" }}>
      <h2>ROS2 Diff Drive Control</h2>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => publish(0.3, 0)}>Forward</button>
        <button onClick={() => publish(0, 0.8)}>Left</button>
        <button onClick={() => publish(0, -0.8)}>Right</button>
        <button onClick={() => publish(0, 0)}>Stop</button>
      </div>

      <h3>Camera Feed</h3>
      {imageSrc && (
        <img
          src={imageSrc}
          alt="camera"
          width="400"
          style={{ border: "2px solid black" }}
        />
      )}
    </div>
  );
}

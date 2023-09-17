import React from "react";
import { Empty, Typography, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Lottie from "react-lottie"; // Import the Lottie component
import animatedSVG from "../assets/Updating_icon_Animated.json";

const { Title } = Typography;

const Updating = ({message}) => {
  const defaultOptions = {
    loop: true, // Set to true if you want the animation to loop
    autoplay: true, // Set to true if you want the animation to play automatically
    animationData: animatedSVG, // Your imported animation JSON
  };

  return (
    <Empty
      className="flex flex-col h-screen justify-center items-center"
      image={<Lottie options={defaultOptions} height={200} width={200} />}
      description={
        <Title className="mt-24" type="warning">
          {message}
        </Title>
      }
    ></Empty>
  );
};

export default Updating;

import React from "react";
import { Form, Input, Button, notification, message } from "antd";
import logo from "../assets/logo.png";

const Auth = ({ onAuthSuccess }) => {
  const [form] = Form.useForm(); 

  const onFinish = async (values) => {
    try {
      if (values.username === "ali" && values.password === "ali") {
        console.log("Authentication successful");

        message.success("Login Successful");
        onAuthSuccess();

        form.resetFields();
    } else {
        console.log("Authentication failed");
        notification.error({
            message: "Authentication Failed",
            description: "Wrong username or password. Please try again.",
        });
        form.resetFields();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <img src={logo} alt="Company Logo" style={{ width: "250px" }} />
      <Form
        name="normal_login"
        onFinish={onFinish}
        form={form} // Pass the form instance to interact with the form
        style={{ width: 450 }}
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: "Please input your Username!" }]}
        >
          <Input placeholder="Username" size="large" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: "Please input your Password!" }]}
        >
          <Input.Password placeholder="Password" size="large" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
            Log in
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Auth;

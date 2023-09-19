import React, { useState, useEffect } from "react";
import { Form, InputNumber, Button, notification, message } from "antd";
import { SendOutlined } from "@ant-design/icons";
import logo from "../assets/logo.png";
import axios from "axios";

const Auth = ({ onAuthSuccess }) => {
  const [inputNumberValue, setInputNumberValue] = useState("");
  const [validationCode, setValidationCode] = useState("");
  const [isUserExist, setIsUserExist] = useState(false);
  const [isSendButtonDisabled, setIsSendButtonDisabled] = useState(true);
  const [loggedUserName, setLoggedUserName] = useState("");
  const [loggedUserAccessType, setLoggedUserAccessType] = useState("");

  const [form] = Form.useForm();

  const OTP_API = "https://192.168.4.10:8001/api/tatreports/getotp/";

  const onFinish = async (values) => {
    try {
      if (String(values.ValidationCode) === String(validationCode)) {
        console.log("Authentication successful");

        message.success("Login Successful");
        onAuthSuccess();

        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("UserName", `${loggedUserName}`);
        sessionStorage.setItem("AccessType", `${loggedUserAccessType}`);

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

  const onNumberCheck = async () => {
    try {
      const response = await axios.get(
        `http://${process.env.REACT_APP_SERVER_ADDRESS}:3005/api/is-user-exist/0${inputNumberValue}`
      );

      console.log(response);
      if (response.status === 200) {
        setIsUserExist(true);
        // Send a notification when status is 200
        notification.success({
          message: ` سلام ${response.data.name}`,
          description:
            "کد احراز هویت برای شما ارسال شد. لطفا آن را وارد نمایید.",
        });
        setLoggedUserName(response.data.name);
        setLoggedUserAccessType(response.data.accessType);

        const otpRespons = await axios.get(`${OTP_API}${inputNumberValue}`);
        if (otpRespons.status === 200) {
          setValidationCode(otpRespons.data);
          console.log(otpRespons.data);
        }
      }
    } catch (error) {
      notification.error({
        message: `عدم دسترسی`,
        description:
          "کاربر گرامی شما اجازه دسترسی و استفاده از این صفحه را ندارید",
      });
    }
  };

  const onChange = (value) => {
    setInputNumberValue(value);

    setIsSendButtonDisabled(!value);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <img src={logo} alt="Company Logo" style={{ width: "250px" }} />
      <Form
        name="normal_login"
        onFinish={onFinish}
        form={form}
        className="w-full max-w-md"
      >
        <div className="flex flex-row my-4">
          <Form.Item name="PhoneNumber" className="flex-1">
            <InputNumber
              className="w-full"
              controls={false}
              addonBefore={"+98"}
              placeholder="شماره تلفن"
              size="large"
              onChange={onChange}
              disabled={isUserExist && true}
              required={true}
            />
          </Form.Item>
          <Button
            type="primary"
            shape="circle"
            size="large"
            className="mx-4"
            onClick={onNumberCheck}
            disabled={isUserExist || isSendButtonDisabled}
          >
            <SendOutlined />
          </Button>
        </div>
        {isUserExist && (
          <div className="flex flex-col">
            <Form.Item name="ValidationCode">
              <InputNumber
                controls={false}
                placeholder="کد احراز هویت را وارد کنید"
                size="large"
                className="flex-grow mr-2 w-full my-4"
              />
            </Form.Item>
            <Button type="primary" size="large" htmlType="submit">
              ورود
            </Button>
          </div>
        )}
      </Form>
    </div>
  );
};

export default Auth;

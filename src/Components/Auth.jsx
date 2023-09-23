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
  const BASE_URL = "https://localhost";

  const config = {
    headers: {
      "Referrer-Policy": "unsafe_url",
    },
  };
  const OTP_API = `https://192.168.4.10:8001/api/tatreports/getotp/`;

  const onFinish = async (values) => {
    try {
      if (String(values.ValidationCode) === String(validationCode)) {
        //console.log("Authentication successful");

        message.success("Login Successful");
        onAuthSuccess();

        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("UserName", `${loggedUserName}`);
        sessionStorage.setItem("AccessType", `${loggedUserAccessType}`);

        form.resetFields();
      } else {
        //console.log("Authentication failed");
        notification.error({
          message: "احراز هویت ناموفق",
          description:
            "کد احراز هویت اشتباه است، لطفا کد احراز هویت را برسی کنید",
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
        `${BASE_URL}:3005/api/is-user-exist/0${inputNumberValue}`,
        config
      );

      // console.log(response);
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

        const otpRespons = await axios.get(
          `${OTP_API}${inputNumberValue}`,
          config
        );
        if (otpRespons.status === 200) {
          setValidationCode(otpRespons.data);
          //console.log(otpRespons.data);
        } else {
          notification.error({
            message: `مشکلی پیش آمده`,
            description:
              "لطفا ارتباط با سرویس پیامکی را چک کنید و یا با پشتیبانی تماس بگیرید",
          });
        }
      } else if (response.status === 403) {
        /* do nothing */
      }
    } catch (error) {
      if (error.response) {
        // The request was made, but the server responded with a status code
        const statusCode = error.response.status;
        console.error(`Request failed with status code: ${statusCode}`);
        notification.error({
          message: `این شماره اجازه دسترسی ندارد`,
          description: "لطفا با پشتیبانی تماس بگیرید222",
        });
      } else if (error.request) {
        notification.error({
          message: `No response received from the server.`,
          description: "لطفا با پشتیبانی تماس بگیرید",
        });
        console.error("");
      } else {
        notification.error({
          message: `Error setting up the request:`,
          description: `${error.message}`,
        });
      }
    }
  };

  const onChange = (value) => {
    setInputNumberValue(value);

    // Define a regular expression to match Iranian phone numbers.
    const iranianPhoneNumberPattern = /^(\+98|0)?9\d{9}$/;

    // Check if the entered value matches the pattern.
    const isValidIranianPhoneNumber = iranianPhoneNumberPattern.test(value);

    // Enable or disable the send button based on validity.
    setIsSendButtonDisabled(!isValidIranianPhoneNumber);
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
              addonBefore={<span className="align-middle">+98</span>}
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

"use client";

import {
  Alert,
  AppBar,
  Box,
  Button,
  Fab,
  IconButton,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import DrawIcon from "@mui/icons-material/Draw";

declare global {
  interface Window {
    ethereum: any;
  }
}

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [payloadText, setPayloadText] = useState<string>("");
  const [payloadTextValid, setPayloadTextValid] = useState<boolean>(true);
  const [payloadTextValidationError, setPayloadTextValidationError] =
    useState<string>("");
  const [payloadDataValidation, setPayloadDataValidation] = useState<{
    types: boolean;
    domain: boolean;
    message: boolean;
  }>({
    types: true,
    domain: true,
    message: true,
  });
  const [signingError, setSigningError] = useState<string>("");

  useEffect(() => {
    setPayloadTextValid(true);
    setPayloadTextValidationError("");
    setPayloadDataValidation({
      types: true,
      domain: true,
      message: true,
    });
    setSigningError("");

    if (!payloadText) {
      return;
    }

    try {
      const payload = JSON.parse(payloadText);
      if (!payload.types) {
        setPayloadDataValidation((prev) => ({ ...prev, types: false }));
      }
      if (!payload.domain) {
        setPayloadDataValidation((prev) => ({ ...prev, domain: false }));
      }
      if (!payload.message) {
        setPayloadDataValidation((prev) => ({ ...prev, message: false }));
      }
      setPayloadTextValid(true);
      setPayloadTextValidationError("");
    } catch (error) {
      setPayloadTextValid(false);
      setPayloadTextValidationError((error as Error).message);
    }
  }, [payloadText]);

  const connectMetaMask = async () => {
    const ethereum = window.ethereum;

    if (typeof ethereum === "undefined") {
      alert("Please install MetaMask");
      return;
    }

    try {
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log(accounts);

      const provider = new ethers.BrowserProvider(ethereum);
      const networkId = await provider.getNetwork();

      setAccount(accounts[0]);
      setNetwork(networkId.name);
    } catch (error) {
      console.error(error);
    }
  };

  const signTypedData = async () => {
    if (!account) {
      alert("Please connect MetaMask");
      return;
    }

    if (
      !payloadTextValid ||
      Object.values(payloadDataValidation).includes(false)
    ) {
      alert("Invalid payload");
      return;
    }

    setSigningError("");

    const payload = JSON.parse(payloadText);
    const ethereum = window.ethereum;
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner(account);

    try {
      const signature = await signer.signTypedData(
        payload.domain,
        payload.types,
        payload.message
      );

      setSignature(signature);
    } catch (error) {
      setSigningError((error as Error).message);
    }
  };

  const onPayloadTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPayloadText(event.target.value);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Signature Tools
          </Typography>
          {account ? (
            <Button color="inherit">{`${network}: ${account}`}</Button>
          ) : (
            <Button color="inherit" onClick={() => connectMetaMask()}>
              Connect MetaMask
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ p: 3 }}>
        <Stack direction="row" spacing={2}>
          <Box flex={1}>
            <TextField
              label="JSON Payload"
              multiline
              fullWidth
              rows={30}
              value={payloadText}
              onChange={onPayloadTextChange}
              error={!payloadTextValid}
              helperText={payloadTextValidationError}
            />
          </Box>
          <Box
            flex={1}
            sx={{
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
              p: 1,
            }}
          >
            <Stack spacing={2}>
              {payloadText &&
                payloadTextValid &&
                Object.entries(payloadDataValidation).map(([key, value]) => (
                  <Alert key={key} severity={value ? "success" : "error"}>
                    {`Payload: ${key} is ${value ? "" : "in"}valid`}
                  </Alert>
                ))}
              {signingError && (
                <Alert severity="error">{`Signing error: ${signingError}`}</Alert>
              )}
              {signature && !signingError && (
                <Alert severity="success">{`Signature: ${signature}`}</Alert>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>
      <Box sx={{ position: "absolute", right: 24, bottom: 50 }}>
        <Fab variant="extended" color="primary" onClick={() => signTypedData()}>
          <DrawIcon sx={{ mr: 1 }} />
          Sign Payload
        </Fab>
      </Box>
    </Box>
  );
}

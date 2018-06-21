import EventEmitter from "eventemitter3";

export default class Project extends EventEmitter {
  constructor() {
    super();

    const { protocol, host } = new URL(window.location.href);

    this.serverUrl = protocol + "//" + host + "/api";

    if (protocol === "http:") {
      this.wsServerUrl = "ws://" + host;
    } else {
      this.wsServerUrl = "wss://" + host;
    }

    this.ws = null;

    this.hierarchy = null;
  }

  async writeBlob(relativePath, blob) {
    const res = await fetch(this.serverUrl + "/files" + relativePath, {
      method: "POST",
      body: blob
    });

    const json = await res.json();

    return json;
  }

  async readBlob(relativePath) {
    const res = await fetch(this.serverUrl + "/files" + relativePath);

    const blob = await res.blob();

    return blob;
  }

  async readJSON(relativePath) {
    const res = await fetch(this.serverUrl + "/files" + relativePath);

    const json = await res.json();

    return json;
  }

  async writeJSON(relativePath, data) {
    const res = await fetch(this.serverUrl + "/files" + relativePath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const json = await res.json();

    return json;
  }

  async openFile(relativePath) {
    const res = await fetch(this.serverUrl + relativePath + "?open=true", {
      method: "POST"
    });

    const json = await res.json();

    return json;
  }

  _onWebsocketMessage = event => {
    const json = JSON.parse(event.data);

    if (json.type === "changed") {
      if (this.watchPromise) {
        this.watchPromise.resolve(json.hierarchy);
        this.watchPromise = undefined;
      }

      this.hierarchy = json.hierarchy;
      this.emit("changed", this.hierarchy);
    }
  };

  _onWebsocketError = error => {
    if (this.watchPromise) {
      this.watchPromise.reject(error);
      this.watchPromise = undefined;
    } else {
      throw error;
    }
  };

  watch() {
    if (this.ws) {
      throw new Error("Already watching project.");
    }

    return new Promise((resolve, reject) => {
      this.watchPromise = { resolve, reject };
      this.ws = new WebSocket(this.wsServerUrl);
      this.ws.addEventListener("message", this._onWebsocketMessage);
      this.ws.addEventListener("error", this._onWebsocketMessage);
    });
  }

  unwatch() {
    this.ws.close();
    return Promise.resolve(this);
  }

  saveScene(...args) {
    console.log("saveScene", ...args);
  }

  saveSceneAs(...args) {
    console.log("saveSceneAs", ...args);
  }

  export(...args) {
    console.log("export", ...args);
  }

  close() {
    this.ws.close();
    return Promise.resolve(this);
  }
}
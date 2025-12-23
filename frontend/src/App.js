import './index.css';
import { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

function App() {
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(false);
  const [emaillist, setEmailList] = useState([]);

  /* ---------------- MESSAGE HANDLER ---------------- */
  function handleMsg(e) {
    setMsg(e.target.value);
  }

  /* ---------------- FILE HANDLER ---------------- */
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
      const data = event.target.result;
      const workbook = XLSX.read(data, { type: "binary" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Read column A
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: "A" });

      const emails = jsonData
        .map(item => item.A)
        .filter(email => email); // remove empty cells

      setEmailList(emails);
    };

    reader.readAsBinaryString(file);
  }

  /* ---------------- SEND EMAIL ---------------- */
  function send() {
    if (!msg || emaillist.length === 0) {
      alert("Please enter message and upload email list");
      return;
    }

    setStatus(true);

   axios.post("https://bulk-mail-2-4jg0.onrender.com/sendmail", { msg, emaillist })
      .then((response) => {
        if (response.data.success) {
          alert("Emails sent successfully!");
        } else {
          alert("Failed to send emails");
        }
        setStatus(false);
      })
      .catch((error) => {
        console.error(error);
        alert("Server error. Check backend.");
        setStatus(false);
      });
  }

  /* ---------------- UI ---------------- */
  return (
    <div>
      {/* HEADER */}
      <div className="bg-blue-950 text-white text-center">
        <h1 className="text-2xl font-medium px-5 py-3">BulkMail</h1>
      </div>

      <div className="bg-blue-800 text-white text-center">
        <h2 className="font-medium px-5 py-3">
          Send multiple emails at once
        </h2>
      </div>

      <div className="bg-blue-600 text-white text-center">
        <h3 className="font-medium px-5 py-3">Upload Excel File</h3>
      </div>

      {/* CONTENT */}
      <div className="bg-blue-400 flex flex-col items-center text-black px-5 py-6">

        <textarea
          value={msg}
          onChange={handleMsg}
          className="w-[80%] h-32 p-2 outline-none border border-black rounded-md"
          placeholder="Enter email message"
        />

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="border-4 border-dashed py-4 px-4 mt-5 mb-3"
        />

        <p className="font-medium">
          Total emails loaded: {emaillist.length}
        </p>

        <button
          onClick={send}
          disabled={status}
          className="bg-blue-950 py-2 px-4 text-white font-medium rounded-md mt-3"
        >
          {status ? "Sending..." : "Send"}
        </button>

      </div>
    </div>
  );
}

export default App;

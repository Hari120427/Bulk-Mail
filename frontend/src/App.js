import { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

function App() {
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(false);
  const [emailList, setEmailList] = useState([]);

  // 1. Handle Text Area Change
  function handleMsg(evt) {
    setMsg(evt.target.value);
  }

  // 2. Handle File Upload (Read Excel)
  function handleFile(event) {
    const file = event.target.files[0];

    const reader = new FileReader();
    reader.onload = function (e) {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON and extract emails
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      
      // Assuming the email column header is 'email' or similar. 
      // This grabs the first column value if no header matches, or adjusts to your excel structure.
      const emails = jsonData.map((row) => row.email || Object.values(row)[0]);
      
      setEmailList(emails);
      console.log("Emails loaded:", emails);
    };
    
    reader.readAsBinaryString(file);
  }

  // 3. Send Emails (THE FIX IS HERE)
  function send() {
    setStatus(true);

    // FIXED URL: Added "/sendmail" to the end
    axios.post("https://bulk-mail-f0a6.onrender.com/sendmail", { 
        msg: msg,
        emaillist: emailList 
    })
    .then(function (data) {
      if (data.data.success) {
        alert("Sent Successfully");
        setStatus(false);
      } else {
        alert("Failed");
        setStatus(false);
      }
    })
    .catch(function (error) {
      console.log(error);
      alert("Server error. Check backend or Network.");
      setStatus(false);
    });
  }

  return (
    <div>
      {/* Header Section */}
      <div className="bg-slate-900 text-white text-center p-5">
        <h1 className="text-2xl font-bold">BulkMail</h1>
      </div>

      <div className="bg-blue-800 text-white text-center p-3 font-medium">
        <p>Send multiple emails at once</p>
      </div>

      <div className="bg-blue-600 text-white text-center p-3 font-medium">
        <p>Upload Excel File</p>
      </div>

      {/* Main Content */}
      <div className="bg-blue-400 flex flex-col items-center px-5 py-8 h-screen">
        
        {/* Text Area */}
        <textarea
          onChange={handleMsg}
          value={msg}
          className="w-[80%] h-32 py-2 px-2 outline-none border border-black rounded-md mb-5 text-black"
          placeholder="Enter your email message..."
        ></textarea>

        {/* File Input */}
        <div className="border-2 border-dashed border-white p-4 rounded-md mb-3">
          <input 
            type="file" 
            onChange={handleFile} 
            className="file:bg-gray-200 file:border-none file:px-3 file:py-1 file:rounded cursor-pointer text-white"
          />
        </div>

        <p className="mb-4 font-bold text-black">Total emails loaded: {emailList.length}</p>

        {/* Send Button */}
        <button
          onClick={send}
          className={`bg-slate-900 text-white px-5 py-2 rounded-md font-bold ${
            status ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-800"
          }`}
          disabled={status}
        >
          {status ? "Sending..." : "Send"}
        </button>

      </div>
    </div>
  );
}

export default App;
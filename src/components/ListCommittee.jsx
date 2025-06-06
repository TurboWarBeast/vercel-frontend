import React, { useState, useEffect } from "react";
import {
  createCommittee,
  getallcommittees,
  deleteCommitte,
  editCommittee,
} from "../services/ConferenceServices";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import homeIcon from "../assets/home36.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faFilePdf } from "@fortawesome/free-solid-svg-icons";

function ListCommittee() {
  const [committees, setCommittees] = useState([]); // Create a state variable to hold the list of committees
  const [editingId, setEditingId] = useState(null);
  const [data, SetData] = useState(true);
  const [editingValue, setEditingValue] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [conference_name, setConference_name] = useState('');
  const [updateMessage, setUpdateMessage] = useState("");

  const navigate = useNavigate();

  const handleEditChange = (event) => {
    setEditingValue(event.target.value);
  };

  useEffect(() => {
    const conference_id = sessionStorage.getItem("con");
    if (conference_id) {
      getallcommittees(conference_id)
        .then((res) => {
            setCommittees(res.data.committee);
            setConference_name(res.data.conferenceName);
            SetData(false);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, []);

  const handleSaveEdit = (id, name) => {
    const updatedCommittees = committees.map((committee) =>
      committee._id === id
        ? { ...committee, committee_name: editingValue }
        : committee
    );

    setCommittees(updatedCommittees);

    // Logging the JSON object to the console
    const logObject = {
      committee_name: editingValue,
    };
    editCommittee(id, logObject)
      .then((res) => {
        console.log(res.data);
        setUpdateMessage("Committee updated successfully!");
        setTimeout(() => {
          setUpdateMessage("");
        }, 2000); // hide the message after 2 seconds
      })
      .catch((err) => {
        console.log(err);
      });

    setEditingId(null);
  };
  function hasDuplicates(array) {
    return new Set(array).size !== array.length;
  }
  function anyNameExistsInCommittees(committeeNames) {
    return committeeNames.some((name) =>
      committees.some((committee) => committee.committee_name === name)
    );
  }

  const removeCommittee = (id) => {
    deleteCommitte(id)
      .then((res) => {
        setTemp(1);
      })
      .catch((err) => {});
  };

  const handleEditClick = (id, name) => {
    setEditingId(id);
    setEditingValue(name);
    console.log(name);
  };

  const handleRedirect = () => {
    navigate("/select-conference");
  };

  const redirectToHome = () => {
    navigate("/select-conference");
  };

  const toSentenceCase = (text) => {
    if (!text) return "";
    // Split the text into words
    const words = text.split(' ');
    // Capitalize the first letter of the first word
    if (words.length > 0) {
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
    }
    // Process each word to handle specific acronyms
    return words
      .map((word) => {
        const lowerWord = word.toLowerCase();
        if (lowerWord === 'ai') return 'AI';
        if (lowerWord === 'ml') return 'ML';
        // If the word is already in the desired case (e.g., "AI" or "ML"), preserve it
        if (word === 'AI' || word === 'ML') return word;
        // Otherwise, lowercase the word (except for the first word, which is already handled)
        return word.toLowerCase();
      })
      .join(' ');
  };

  // Function to format conference name in proper title case
  const toTitleCase = (str) => {
    if (!str) return '';
    const minorWords = ['on', 'and', 'the', 'in', 'of', 'for', 'with'];
    return str
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        if (word === 'ai') return 'AI'; // Special case for "AI"
        if (index === 0 || !minorWords.includes(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
      })
      .join(' ');
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      committees.map((item) => ({
        Committee: toSentenceCase(item.committee_name),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Committees");
    XLSX.writeFile(workbook, "Committees_Report.xlsx");
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Committees Report", 14, 10);

    const tableColumn = ["Committee"];
    const tableRows = committees.map((item) => [toSentenceCase(item.committee_name)]);

    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    doc.save("Committees_Report.pdf");
  }

  return (
    <div className="w-full h-full border border-3 shadow-sm p-3 mt-2 mb-5 bg-body-tertiary rounded bg-slate-50">
      {/* Home Icon and Title */}
      <div className="relative flex items-center justify-center text-4xl mb-4">
        <img
          src={homeIcon}
          alt="Home"
          className="cursor-pointer w-8 h-8 absolute left-0"
          onClick={redirectToHome}
        />
        <u>List of Committees</u>
      </div>

      {/* Export Buttons */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={exportToExcel}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
          Export to Excel
        </button>
        <button
          onClick={exportToPDF}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
          Export to PDF
        </button>
      </div>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <h2 className="text-xl font-semibold mb-4">
              Conference ID Missing
            </h2>
            <p className="mb-4">Please select a conference to proceed.</p>
            <button
              onClick={handleRedirect}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Go to Conference Selection
            </button>
          </div>
        </div>
      )}

      {updateMessage && (
        <div
          className="flex items-center justify-center p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800"
          role="alert"
        >
          <svg
            aria-hidden="true"
            className="w-5 h-5 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-4.293-3.707a1 1 0 00-1.414 0L9 9.586 7.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5a1 1 0 000-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
          <span className="font-medium">Success!</span> {updateMessage}
        </div>
      )}

      {data ? (
        <div>Loading..</div>
      ) : (
        <>
          <div>

            <div className="w-full m-6">
              <h2 className="text-2xl text font-semibold text-black">
                Conference Name: {toTitleCase(conference_name)}
              </h2>
            </div>

            <div className="w-full m-3 h-96 border border-2 border-cyan-700 overflow-auto">
              <div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Committees
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {committees.map((committee) => (
                      <tr key={committee._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {editingId === committee._id ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={handleEditChange}
                              className="block w-full p-3 ps-10 text-sm text-black border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            />
                          ) : (
                            <span
                              onClick={() =>
                                handleEditClick(
                                  committee._id,
                                  committee.committee_name
                                )
                              }
                            >
                              {toSentenceCase(committee.committee_name)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === committee._id ? (
                            <button
                              onClick={() =>
                                handleSaveEdit(
                                  committee._id,
                                  committee.committee_name
                                )
                              }
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => removeCommittee(committee._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              ✖
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ListCommittee;
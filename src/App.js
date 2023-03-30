import { useState } from "react";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, S3 } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [isUploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const fsize = Math.round(file?.size / 1024);
    if (file && file.type === "video/mp4") {
      if (fsize >= 20000 && fsize <= 1024000) {
        setSelectedFile(file);
        setUploading(true);
        uploadFile(file);
      } else {
        alert("Size range between 50MB and 1GB");
        setSelectedFile(null);
      }
    } else {
      setSelectedFile(null);
      alert("Please select an MP4 file.");
    }
  };

  const handleDrop = (event) => {
    if(showPlayer) return
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file?.type === "video/mp4") {
      setSelectedFile(file);
      setUploading(true);
      uploadFile(file);
    } else {
      setSelectedFile(null);
      alert("Please drop an MP4 file.");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const uploadFile = async (file) => {
    try {
      const parallelUploads3 = new Upload({
        client: new S3Client({
          region: process.env.REACT_APP_AWS_REGION,
          credentials: {
            accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY,
            secretAccessKey: process.env.REACT_APP_AWS_SECRET_KEY,
          },
        }),
        params: {
          Bucket: process.env.REACT_APP_AWS_S3_BUCKET_NAME,
          Key: "files/" + file.name + "-" + uuidv4(),
          Body: file,
          ContentType: file.type,
          ACL: "public-read",
        },
        leavePartsOnError: false,
      });

      parallelUploads3.on("httpUploadProgress", (progress) => {
        let progressPercentage = Math.round(
          (progress.loaded / progress.total) * 100
        );
        setProgress(progressPercentage);
      });

      await parallelUploads3.done().then((res) => {
        setShowPlayer(true);
        setVideoUrl(res.Location);
      });
    } catch (e) {
      console.log(e);
      setSelectedFile(null);
    }
  };

  const handleCancel = () => {
    setShowPlayer(false);
    setVideoUrl(null);
    setSelectedFile(null);
  };

  return (
    <div className="h-screen grid place-items-center">
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center px-2 py-10 bg-white rounded-lg shadow-xl">
        {showPlayer ? (
          <video
            className="rounded-lg mb-5"
            height={300}
            width={300}
            src={videoUrl}
            controls
            autoPlay
          ></video>
        ) : (
          <div className="hidden"></div>
        )}
        <h1 className="text-2xl font-medium mb-2 text-center">
          You can upload video
        </h1>
        <p className="text-xs font-medium text-center text-gray-400">
          CLICK ON THE BUTTON OR DRAG&DROP FILE HERE
        </p>
        <label
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          htmlFor="file"
          className="px-5 mt-7 rounded-md text-white bg-[#3c9eff] hover:bg-[#238ef9] transition-all duration-500 shadow-[#338bff8c] shadow-lg"
        >
          <i className="fa-solid fa-arrow-up-from-bracket py-4 border-r-[1px] border-gray-100 pr-3"></i>
          <span className="pl-3 font-semibold">Upload Video</span>
        </label>
        <input
          disabled={selectedFile && true}
          id="file"
          type="file"
          accept="video/mp4"
          onChange={handleFileChange}
          className="hidden"
        />
        {isUploading && selectedFile && (
          <div className="flex items-center bg-white shadow-2xl shadow-[#338bffaf] w-3/4 rounded-lg mt-10">
            <div className="hidden md:block py-4 border-r-[1px] border-[#338bff55] text-[#3c9eff] px-6">
              {/* <i class="fa-solid fa-play"></i> */}
              <i className="fa-solid fa-play "></i>
            </div>
            <div className="relative my-4 md:py-0 px-6 w-full flex flex-col justify-center items-start">
              <p className="pb-1 items-center flex">
                <span className="text-sm font-medium text-gray-400">
                  File&nbsp;&nbsp;
                </span>
                <span className="text-gray-500 font-semibold text-sm w-[40%] overflow-hidden inline-block truncate">
                  {selectedFile?.name}
                </span>
                <span
                  className={`text-sm font-medium text-gray-400 ${
                    progress === 100 ? "text-green-600" : "text-red-700"
                  }`}
                >
                  &nbsp;&nbsp;
                  {progress === 100 ? "Completed" : "is uploading..."}
                </span>
              </p>
              <progress
                className="w-full"
                value={progress}
                max={100}
              ></progress>
              <button
                onClick={handleCancel}
                className="absolute -right-3 -top-6 hover:bg-[#3c9dffe3] transition-all duration-500 bg-[#3c9eff] text-white rounded-full px-[9px] py-[7px] text-xs flex items-center"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

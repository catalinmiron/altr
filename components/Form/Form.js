import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ga from 'react-ga';

import { breakpoints } from '../../theme';
import Upload from './Upload';
import ImageOptions from './ImageOptions';
import VideoOptions from './VideoOptions';
import AudioOptions from './AudioOptions';
import Download from './Download';

export default function Form() {
  const [error, setError] = useState();
  const [file, setFile] = useState();
  const [result, setResult] = useState();
  const [waiting, setWaiting] = useState();

  // clear errors on click
  const form = useRef();
  useEffect(() => {
    form.current.addEventListener('click', () => setError());
  });

  // submit file and chosen options
  const submit = options => {
    const reqData = new FormData();
    reqData.append('file', file);
    for (const option of Object.keys(options)) {
      if (options[option]) reqData.set(option, options[option]);
    }

    setWaiting(true);
    axios
      .post('https://altr.app/upload', reqData, { responseType: 'blob' })
      .then(res => {
        setWaiting(false);
        // combine the old name with the new extension
        const name = `${file.name.replace(/(?:\.([^.]+))?$/, '')}.${options.format}`;
        setResult(new File([res.data], name));
      })
      .catch(err => {
        setWaiting(false);

        if (err.response) {
          const reader = new FileReader();
          reader.onload = e => setError(e.target.result);
          reader.readAsText(err.response.data);
        } else if (err.request) {
          setError('Something went wrong.');
        }
      });
  };

  // reset state to go through the form again
  const reset = () => {
    setError();
    setFile();
    setResult();
    setWaiting();
  };

  // decide which stage to show
  let stage;
  if (result || waiting) stage = <Download result={result} reset={reset} />;
  else if (file && /^image/.test(file.type)) {
    stage = <ImageOptions submit={submit} />;
    ga.event({ category: 'Tool', action: 'Upload', label: 'Image' });
  } else if (file && /^video/.test(file.type)) {
    stage = <VideoOptions submit={submit} />;
    ga.event({ category: 'Tool', action: 'Upload', label: 'Video' });
  } else if (file && /^audio/.test(file.type)) {
    stage = <AudioOptions submit={submit} />;
    ga.event({ category: 'Tool', action: 'Upload', label: 'Audio' });
  } else stage = <Upload upload={setFile} setError={setError} />;

  return (
    <div className="form-container" ref={form}>
      <div className="top-bar">
        {/* blank elements center the error message whether the back button is present or not */}
        {!result && !waiting && file ? (
          <p className="back" onClick={() => setFile()}>
            <i className="uil uil-angle-left" /> back
          </p>
        ) : (
          <p className="blank" />
        )}
        {error && <p className="error">{error}</p>}
        <p className="blank" />
      </div>

      {stage}

      <style jsx>{`
        .form-container {
          display: block;
          margin: 3em 0.5em 0 0.5em;
          box-shadow: 0 4px 12px hsla(0, 0%, 0%, 0.15);
          border-radius: 28px;
          padding: 2em 3em;
          background-color: white;
        }

        .top-bar {
          display: flex;
          flex-flow: row wrap;
          align-items: center;
          justify-content: center;
          margin-bottom: 1em;
        }

        .back,
        .blank {
          flex: 1;
        }

        .error {
          font-size: 0.7em;
          font-weight: 500;
          color: hsla(0, 100%, 65%, 0.9);
        }

        .back {
          text-align: left;
          display: flex;
          align-items: center;
          font-size: 0.8em;
          font-weight: 500;
          color: hsla(0, 0%, 18%, 0.85);
        }

        .back:hover {
          cursor: pointer;
        }

        .back i {
          font-size: 1.2em;
        }

        @media ${breakpoints.sm} {
          .form-container {
            width: 32em;
            margin: 3em auto 0 auto;
            padding: 2.5em 5em;
          }
        }

        @media ${breakpoints.md} {
          .form-container {
            width: 34em;
          }
        }
      `}</style>

      {/* options styling */}
      <style jsx global>{`
        .options {
          margin-top: 1.5em;
        }

        .options__row {
          display: flex;
          flex-flow: row nowrap;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5em;
        }

        .options__submit {
          cursor: pointer;
          margin-top: 2.5em;
          font-family: inherit;
          font-size: 0.8em;
          color: hsla(0, 0%, 18%, 0.8);
          font-weight: 600;
          padding: 0.8em 2em;
          box-shadow: 0 4px 12px hsla(0, 0%, 0%, 0.15);
          border-radius: 10px;
          border: none;
          background-color: white;
        }

        .options__submit:hover {
          box-shadow: 0 4px 14px hsla(0, 0%, 0%, 0.175);
        }

        .options__submit:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}

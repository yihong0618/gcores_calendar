import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';

import { graphql } from 'gatsby';
import Layout from '../components/layout';
import { activities } from '../static/audios';
import GitHubSvg from '../../assets/github.svg';
import {
  filterAndSortAudios, sortDateFunc, secondsToHms, filterYear, filterDjs, sortDateFuncReverse, scrollToMap, intComma,
} from '../utils/utils';
import styles from './gocres.module.scss';

// const
let yearsArr = [];
const yearDJSMap = new Map();
const yearDurationMap = new Map();

// generate base attr
((items) => {
  const yearDJS = {};
  const yearDuration = {};
  items.forEach(
    (item) => {
      const y = item.created_at.slice(0, 4);
      // ignore the first
      if (+y > 2000) {
        yearsArr.push(y);
        const djsArr = item.djs;
        if (yearDJS[y] === undefined) {
          yearDJS[y] = djsArr;
        } else {
          yearDJS[y].push(...djsArr);
        }
        yearDuration[y] = (yearDuration[y] === undefined ? item.duration : yearDuration[y] + item.duration);
      }
    },
  );
  yearsArr = [...new Set(yearsArr)].sort().reverse();

  // set year djs attr
  const yearDjsArr = Object.entries(yearDJS);
  const totalArr = [];
  yearDjsArr.forEach((djs) => {
    const yearDjsSet = new Set(djs[1]);
    yearDJSMap.set(djs[0], [...yearDjsSet]);
    totalArr.push(...yearDjsSet);
  });
  yearDJSMap.set('Total', [...new Set(totalArr)]);

  // set year duration attr
  let totalDuration = 0;
  const yearDurationArr = Object.entries(yearDuration);
  yearDurationArr.forEach((d) => {
    totalDuration += d[1];
    yearDurationMap.set(d[0], secondsToHms(d[1]));
  });
  yearDurationMap.set('Total', secondsToHms(totalDuration));
})(activities);

let thisYear = '';
if (yearsArr) {
  [thisYear] = yearsArr;
}

// Page
export default ({ data }) => {
  const [year, setYear] = useState(thisYear);
  const [audios, setActivity] = useState(filterAndSortAudios(activities, filterYear, year, sortDateFunc));
  const [audio, setAudio] = useState('');
  const [djs, setDjs] = useState(yearDJSMap.get(thisYear));

  const changeYear = (year) => {
    setYear(year);
    setDjs(yearDJSMap.get(year));
    setAudio('');
    scrollToMap();
    setActivity(filterAndSortAudios(activities, filterYear, year, sortDateFunc));
  };

  const locateActivity = (audio) => {
    scrollToMap();
    setAudio(audio);
  };

  const changeDjs = (djsName) => {
    setActivity(filterAndSortAudios(activities, filterDjs, djsName, sortDateFunc));
  };

  useEffect(() => {
    let rectArr = document.querySelectorAll('rect');
    if (rectArr.length !== 0) {
      rectArr = Array.from(rectArr).slice(1);
    }
    rectArr.forEach((rect) => {
      const rectColor = rect.getAttribute('fill');
      // not run has no click event
      if (rectColor !== '#444444') {
        const audioDate = rect.innerHTML;
        const [audioName] = audioDate.match(/\d{4}-\d{1,2}-\d{1,2}/) || ['2021'];
        const audio = audios.filter(
          (r) => r.created_at.slice(0, 10) === audioName,
        ).sort((a, b) => b.distance - a.distance);

        // do not add the event next time
        // maybe a better way?
        if (audio) {
          rect.onclick = () => console.log(1);
        }
      }
    });
  }, [year]);

  return (
    <>
      <Helmet bodyAttributes={{ class: styles.body }} />
      <Layout>
        <div className="mb5">
          <div className="w-100">
            <h1 className="f1 fw9 i">Gcores Audio</h1>
          </div>
          <YearsStat audios={activities} year={year} onClick={changeYear} />
          <div className="fl w-100 w-70-l">
            <AudiosMap
              data={data}
              audios={audios}
              year={year}
              changeDjs={changeDjs}
              changeYear={changeYear}
              djs={djs}
            />
            {audio && (
            <AudioInfo
              data={data}
              audio={audio}
            />
            )}
            {year === 'Total' ? <SVGStat />
              : (
                <AudioTable
                  audios={audios}
                  year={year}
                  locateActivity={locateActivity}
                />
              )}
          </div>
        </div>
      </Layout>
    </>
  );
};

// Child components
const ImgFiles = ({
  data, djs, year, changeDjs,
}) => {
  const size = year === 'Total' ? 2 : 3;
  let avatars = data.avatars.edges;
  avatars = avatars.filter((a) => djs.includes(a.node.image.originalName.split('.')[0]));
  avatars = avatars.sort((a, b) => (+a.node.image.originalName.split('.')[0]) - (+b.node.image.originalName.split('.')[0]));

  const handleClick = (djsRootName) => {
    const djsName = djsRootName.split('.')[0];
    changeDjs(djsName);
  };
  return (
    <>
      {avatars.map((edge) => (
        <picture title={edge.node.image.originalName} onClick={() => handleClick(edge.node.image.originalName)} className={styles.picture}>
          <source
            srcSet={edge.node.image.srcSet}
            type="image/jpeg"
          />
          <source
            srcSet={edge.node.image.srcSetWebp}
            type="image/webp"
          />
          <img
            className={`dib w${size} h${size} br-100`}
            src={edge.node.image.base64}
          />
        </picture>
      ))}
    </>
  );
};

const SVGStat = () => (
  <div>
    <GitHubSvg className={styles.audioSVG} />
  </div>
);

const YearsStat = ({ audios, year, onClick }) => {
  // make sure the year click on front
  let yearsArrayUpdate = yearsArr.slice();
  yearsArrayUpdate = yearsArrayUpdate.filter((x) => x !== year);
  yearsArrayUpdate.unshift(year);

  // for short solution need to refactor
  return (
    <div className="fl w-100 w-30-l pb5 pr5-l">
      <section className="pb4" style={{ paddingBottom: '0rem' }}>
        <p>
          机核
          {yearsArr.length}
          年了，
          {yearsArr.length}
          年不容易祝机核越来越好，下面是
          {year}
          的电台数据
          <br />
        </p>
      </section>
      <hr color="blue" />
      {yearsArrayUpdate.map((year) => (
        <YearStat key={year} audios={audios} year={year} onClick={onClick} />
      ))}
      <YearStat key="Total" audios={audios} year="Total" onClick={onClick} />
    </div>
  );
};

const YearStat = ({ audios, year, onClick }) => {
  if (yearsArr.includes(year)) {
    audios = audios.filter((audio) => audio.created_at.slice(0, 4) === year);
  }
  let sumLikes = 0;
  let sumBookmarks = 0;
  let sumComments = 0;
  const djsSet = new Set();
  audios.forEach((audio) => {
    if (audio.likes_count) {
      sumLikes += audio.likes_count || 0;
    }
    if (audio.bookmarks_count) {
      sumBookmarks += audio.bookmarks_count || 0;
    }
    if (audio.comments_count) {
      sumComments += audio.comments_count || 0;
    }
    if (audio.djs) {
      const { djs } = audio;
      djs.forEach((d) => {
        djsSet.add(d);
      });
    }
  });
  return (
    <div style={{ cursor: 'pointer' }} onClick={() => onClick(year)}>
      <section>
        <Stat value={year} description=" Audios" />
        <Stat value={audios.length} description=" 期" />
        <Stat value={sumLikes} description=" Likes" />
        <Stat value={sumBookmarks} description=" Marks" />
        <Stat value={sumComments} description=" Comments" />
        <Stat value={[...djsSet].length} description=" DJS" />
      </section>
      <hr color="blue" />
    </div>
  );
};

const AudiosMap = ({
  data, changeDjs, changeYear, djs, year,
}) => {
  const duration = yearDurationMap.get(year);
  return (
    <div>
      <RunMapButtons changeYear={changeYear} />
      <ImgFiles data={data} djs={djs} year={year} changeDjs={changeDjs} />
      <h1>
        {year}
        {' '}
        电台时长
        {' '}
        {duration}
      </h1>
    </div>
  );
};

const AudioInfo = ({ data, audio }) => (
  <div>
    <h1>{audio.title}</h1>
    <ImgFiles data={data} djs={audio.djs} />
  </div>
);

const RunMapButtons = ({ changeYear }) => {
  const yearsButtons = yearsArr.slice();
  yearsButtons.push('Total');
  const [index, setIndex] = useState(0);
  const handleClick = (e, year) => {
    const elementIndex = yearsButtons.indexOf(year);
    e.target.style.color = 'rgb(244, 67, 54)';

    const elements = document.getElementsByClassName(styles.button);
    elements[index].style.color = 'blue';
    setIndex(elementIndex);
  };
  return (
    <div>
      <ul className={styles.buttons}>
        {yearsButtons.map((year) => (
          <li
            key={`${year}button`}
            style={{ color: year === '2020' ? 'rgb(244, 67, 54)' : 'blue' }}
            year={year}
            onClick={(e) => {
              changeYear(year);
              handleClick(e, year);
            }}
            className={styles.button}
          >
            {year}
          </li>
        ))}
      </ul>
    </div>
  );
};

const AudioTable = ({ audios, year, locateActivity }) => {
  const [audioIndex, setaudioIndex] = useState(-1);
  if (!yearsArr.includes(year)) {
    // When total show 2020
    year = '2020';
  }
  audios = audios.filter((audio) => audio.created_at.slice(0, 4) === year);
  audios.sort((a, b) => new Date(b.created_at.replace(' ', 'T')) - new Date(a.created_at.replace(' ', 'T')));

  return (
    <div className={styles.tableContainer}>
      <table className={styles.audioTable} cellSpacing="0" cellPadding="0">
        <thead>
          <tr>
            <th />
            <th>Likes</th>
            <th>Comments</th>
            <th>Bookmarks</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {audios.map((audio) => (
            <AudioRow
              audios={audios}
              audio={audio}
              key={audio.audio_id}
              locateActivity={locateActivity}
              audioIndex={audioIndex}
              setaudioIndex={setaudioIndex}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AudioRow = ({
  audios, audio, locateActivity, audioIndex, setaudioIndex,
}) => {
  // change click color
  const handleClick = (e, audios, audio) => {
    const elementIndex = audios.indexOf(audio);
    e.target.parentElement.style.color = 'blue';

    const elements = document.getElementsByClassName(styles.audioRow);
    if (audioIndex !== -1) {
      elements[audioIndex].style.color = 'rgb(244, 67, 54)';
    }
    setaudioIndex(elementIndex);
  };

  return (
    <tr
      className={styles.audioRow}
      key={audio.created_at}
      onClick={(e) => {
        handleClick(e, audios, audio);
        locateActivity(audio);
      }}
    >
      <td title={audio.title}>{audio.title.slice(0, 20)}</td>
      <td>{audio.likes_count}</td>
      <td>{audio.comments_count}</td>
      <td>{audio.bookmarks_count}</td>
      <td className={styles.runDate}>{audio.created_at.slice(0, 10)}</td>
    </tr>
  );
};

const Stat = ({
  value, description, className, citySize,
}) => (
  <div className={`${className} pb2 w-100`}>
    <span className={`f${citySize || 1} fw9 i`}>{intComma(value)}</span>
    <span className="f3 fw6 i">{description}</span>
  </div>
);

export const query = graphql`
  query AvatarsQuery {
      avatars: allImageSharp
      {
        edges {
          node {
            id
            image: fluid(srcSetBreakpoints: [32, 64, 96], quality: 100) {
              originalName
              src
              srcSet
              srcSetWebp
              base64
          }
        }
      }
    }
  }
`;

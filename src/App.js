import ImageZoomer from "./ImageZoomer/ImageZoomer";
import s from "./app.module.scss";
import { useCallback, useState } from "react";

export default function App() {
  const [i, seti ] = useState(0);
  const handleBtnClick = useCallback(
    () => {
      seti(i + 1);
    },
    [seti, i]
  )
  return (
    <div className="App">
      <ImageZoomer
        className={s.imageZoomer}
        src="https://images.express.com/is/image/expressfashion/0091_07191212_0058_e1_f001?cache=on&wid=960&fmt=jpeg&qlt=85,1&resmode=sharp2&op_usm=1,1,5,0&defaultImage=Photo-Coming-Soon"
        alt="whatever"
      >
        <button className={s.button} type="button" onClick={handleBtnClick}>
          Add To Bag {i}
        </button>
      </ImageZoomer>
      <div className={s.log} id="screenLog" />
    </div>
  );
}

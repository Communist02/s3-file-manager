import { ImSpinner2 } from "react-icons/im";
import "./Loader.scss";
import { Spin } from 'antd';

const Loader = ({ loading = false, className }) => {
  if (!loading) return null;

  return (
    <div className={`loader-container ${className}`}>
      <Spin size="large" />
    </div>
  );
};

export default Loader;

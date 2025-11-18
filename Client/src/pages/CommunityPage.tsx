// Usuń tę linię: import React from 'react';
import styles from "./CommunityPage.module.scss"; // Assuming this file exists and is used
import CalendarContainer from "../components/Calendar/CalendarContainer";

const CommunityPage = () => {
  return (
    <div className={styles.communityContainer}>
      {" "}
      {/* Use styles if defined */}
      <h1>Społeczność</h1>
      <p>Ta strona jest w budowie.</p>
      Remove any unused <CalendarContainer />
    </div>
  );
};

export default CommunityPage;

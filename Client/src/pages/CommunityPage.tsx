// Usuń tę linię: import React from 'react';
import styles from "./CommunityPage.module.scss"; // Assuming this file exists and is used
// Usuń tę linię: import Calendar from '../components/Calendar/UsosCalendar'; // Assuming path

const CommunityPage = () => {
  return (
    <div className={styles.communityContainer}>
      {" "}
      {/* Use styles if defined */}
      <h1>Społeczność</h1>
      <p>Ta strona jest w budowie.</p>
      {/* Remove any unused <Calendar /> component */}
    </div>
  );
};

export default CommunityPage;

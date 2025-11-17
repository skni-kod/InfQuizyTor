import React from "react";
import { useUsosApi } from "../../hooks/useUsosApi";
import { UsosBuilding } from "../../assets/types";
import Card from "../Common/Card";
import styles from "./BuildingIndexWidget.module.scss";
import { FaMapMarkerAlt, FaRegImage } from "react-icons/fa";

const BuildingIndexWidget: React.FC = () => {
  const apiPath = "services/geo/building_index";

  // Prosimy o kluczowe pola, w tym zagnieżdżone 'photo_urls(screen)'
  // UWAGA: Jeśli to powoduje błąd 400 (jak 'unrecognized character "("'),
  // uprość 'fields' do "id|name|postal_address|location|photo_urls"
  const fields = "id|name|postal_address|location|photo_urls";
  // Ten endpoint zwraca tablicę UsosBuilding[]
  const { data, loading, error } = useUsosApi<UsosBuilding[]>(apiPath, fields);

  // Funkcja renderująca link do Google Maps
  const renderMapLink = (location: UsosBuilding["location"]) => {
    if (!location) {
      return null;
    }
    const { lat, long } = location;
    return (
      <a
        href={`https://www.google.com/maps?q=${lat},${long}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.mapLink}
      >
        <FaMapMarkerAlt /> Pokaż na mapie
      </a>
    );
  };

  // Funkcja renderująca obrazek budynku
  const renderBuildingImage = (photo: UsosBuilding["photo_urls"]) => {
    const imageUrl = photo?.screen;

    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt="Budynek"
          className={styles.buildingImage}
          loading="lazy"
        />
      );
    }
    return (
      <div className={styles.imagePlaceholder}>
        <FaRegImage />
      </div>
    );
  };

  let content: React.ReactNode;

  if (loading) {
    content = <p>Ładowanie listy budynków...</p>;
  } else if (error) {
    content = <p className={styles.error}>Błąd ładowania budynków: {error}</p>;
  } else if (data && data.length > 0) {
    content = (
      <ul className={styles.buildingList}>
        {data.map((building) => (
          <li key={building.id} className={styles.buildingItem}>
            {renderBuildingImage(building.photo_urls)}
            <div className={styles.buildingDetails}>
              <span className={styles.buildingName}>
                {building.name.pl || building.name.en}
              </span>
              <span className={styles.buildingAddress}>
                {building.postal_address || "Brak adresu"}
              </span>
              {renderMapLink(building.location)}
            </div>
          </li>
        ))}
      </ul>
    );
  } else {
    content = <p>Nie znaleziono żadnych budynków.</p>;
  }

  // Ustawiamy wysokość Card, aby lista była przewijalna
  return (
    <Card title="Budynki Uczelni" className={styles.widgetCard}>
      {content}
    </Card>
  );
};

export default BuildingIndexWidget;

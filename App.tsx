import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import MapView, { Marker, Circle, MapPressEvent } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

import { SavedPlace, Coordinate } from "./types";
import { useLocation } from "./useLocation";

export default function App() {
  const mapRef = useRef<MapView>(null);
  const { location } = useLocation();
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [initialRegion] = useState({
    latitude: 17.803266,
    longitude: 102.747888,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceDesc, setNewPlaceDesc] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Coordinate | null>(null);
  const [isTracking, setIsTracking] = useState(true);

  // --- Handle Map Press ---
  const handleMapPress = (event: MapPressEvent) => {
    setSelectedLocation(event.nativeEvent.coordinate);
    setAddModalVisible(true);
    setIsTracking(false);
  };

  // --- Recenter Map ---
  const recenterMap = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
      setIsTracking(true);
    }
  };

  // --- Save Place ---
  const saveCurrentPlace = () => {
    if (!selectedLocation && !location) return;
    if (!newPlaceName.trim()) {
      Alert.alert("Missing Name", "Please enter a name.");
      return;
    }

    const targetLocation = selectedLocation || {
      latitude: location!.coords.latitude,
      longitude: location!.coords.longitude,
    };

    const newPlace: SavedPlace = {
      id: Date.now().toString(),
      latitude: targetLocation.latitude,
      longitude: targetLocation.longitude,
      name: newPlaceName,
      description: newPlaceDesc,
    };

    setSavedPlaces((prev: SavedPlace[]) => [...prev, newPlace]);
    closeAddModal();
  };

  // --- Go To Place ---
  const goToPlace = (place: SavedPlace) => {
    setListModalVisible(false);
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: place.latitude,
          longitude: place.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
      setIsTracking(false);
    }
  };

  // --- Delete Place ---
  const deletePlace = (id: string) => {
    Alert.alert("Delete Place", "Are you sure you want to delete this place?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          setSavedPlaces((prev: SavedPlace[]) =>
            prev.filter((p: SavedPlace) => p.id !== id)
          ),
      },
    ]);
  };

  // --- Edit Place ---
  const editPlace = (id: string) => {
    const place = savedPlaces.find((p) => p.id === id);
    if (!place) return;
    setNewPlaceName(place.name);
    setNewPlaceDesc(place.description || "");
    setSelectedLocation({ latitude: place.latitude, longitude: place.longitude });
    setAddModalVisible(true);
    setSavedPlaces((prev: SavedPlace[]) => prev.filter((p) => p.id !== id));
    setIsTracking(false);
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    setSelectedLocation(null);
    setNewPlaceName("");
    setNewPlaceDesc("");
  };

  // --- Render User Marker ---
  const renderUserMarker = () => {
    if (!location) return null;
    return (
      <>
        {isTracking && (
          <Circle
            center={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            radius={25}
            strokeColor="rgba(66,133,244,0.5)"
            fillColor="rgba(66,133,244,0.3)"
          />
        )}
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="You are here"
          description="Current Location"
          pinColor="#005becff"
        />
      </>
    );
  };

  // --- Render Selected Marker ---
  const renderSelectedLocationMarker = () => {
    if (!selectedLocation) return null;
    return <Marker coordinate={selectedLocation} pinColor="#f2ff00ff" />;
  };

  // --- Render Saved Places ---
  const renderSavedPlacesMarkers = () =>
    savedPlaces.map((place) => (
      <Marker
        key={place.id}
        coordinate={{ latitude: place.latitude, longitude: place.longitude }}
        title={place.name}
        description={place.description}
        pinColor="#34A853"
      />
    ));

  // --- Render List Item ---
  const renderListItem = ({ item }: { item: SavedPlace }) => (
    <View style={styles.listItem}>
      <TouchableOpacity style={styles.listItemContent} onPress={() => goToPlace(item)}>
        <View style={styles.listItemIcon}>
          <Ionicons name="location" size={20} color="#00dd3bff" />
        </View>
        <View style={styles.listItemText}>
          <Text style={styles.listItemTitle}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.listItemSubtitle} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
      <View style={styles.listItemActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => editPlace(item.id)}>
          <Ionicons name="create-outline" size={18} color="#5f6368" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => deletePlace(item.id)}>
          <Ionicons name="trash-outline" size={18} color="#d41200ff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        onPress={handleMapPress}
      >
        {renderUserMarker()}
        {renderSelectedLocationMarker()}
        {renderSavedPlacesMarkers()}
      </MapView>

      {/* Floating Action Buttons */}
      <TouchableOpacity style={[styles.fab, styles.recenterFab]} onPress={recenterMap}>
        <Ionicons name="locate" size={24} color={isTracking ? "#005bedff" : "#5f6368"} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.fab, styles.addFab]}
        onPress={() => {
          setSelectedLocation(null);
          setAddModalVisible(true);
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.fab, styles.listFab]} onPress={() => setListModalVisible(true)}>
        <Ionicons name="list" size={24} color="#005bedff" />
      </TouchableOpacity>

      {/* Tracking Status */}
      <View style={styles.trackingStatus}>
        <View
          style={[styles.statusDot, { backgroundColor: isTracking ? "#00dd3bff" : "#d41200ff" }]}
        />
        <Text style={styles.statusText}>{isTracking ? "Tracking active" : "Tracking paused"}</Text>
      </View>

      {/* Add Place Modal */}
      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={closeAddModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedLocation ? "Save Selected Location" : "Save Current Location"}
              </Text>
              <TouchableOpacity onPress={closeAddModal}>
                <Ionicons name="close" size={24} color="#5f6368" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Location name"
                placeholderTextColor="#9aa0a6"
                value={newPlaceName}
                onChangeText={setNewPlaceName}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                placeholderTextColor="#9aa0a6"
                multiline
                numberOfLines={3}
                value={newPlaceDesc}
                onChangeText={setNewPlaceDesc}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={closeAddModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={saveCurrentPlace}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* List Modal */}
      <Modal visible={listModalVisible} transparent animationType="slide" onRequestClose={() => setListModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.listModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Locations</Text>
              <TouchableOpacity onPress={() => setListModalVisible(false)}>
                <Ionicons name="close" size={24} color="#5f6368" />
              </TouchableOpacity>
            </View>
            {savedPlaces.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pin-outline" size={48} color="#dadce0" />
                <Text style={styles.emptyStateText}>No saved locations</Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap the + button or tap on the map to save your first location
                </Text>
              </View>
            ) : (
              <FlatList
                data={savedPlaces}
                keyExtractor={(item) => item.id}
                renderItem={renderListItem}
                style={styles.list}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f7" },
  map: { flex: 1 },
  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: "white",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recenterFab: { top: Platform.OS === "ios" ? 60 : 30 },
  addFab: { bottom: 120, backgroundColor: "#4285F4" },
  listFab: { bottom: 40 },
  trackingStatus: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 30,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  statusText: { fontSize: 12, color: "#5f6368" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContainer: { backgroundColor: "white", width: "100%", borderRadius: 12, overflow: "hidden" },
  listModalContainer: { backgroundColor: "white", width: "100%", borderRadius: 12, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#dadce0" },
  modalTitle: { fontSize: 18, fontWeight: "500", color: "#202124" },
  inputContainer: { padding: 16 },
  input: { borderWidth: 1, borderColor: "#dadce0", borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16, color: "#202124" },
  textArea: { height: 80, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", padding: 16, borderTopWidth: 1, borderTopColor: "#dadce0", gap: 10 },
  button: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
  cancelButton: { backgroundColor: "transparent" },
  cancelButtonText: { color: "#5f6368", fontWeight: "500" },
  saveButton: { backgroundColor: "#4285F4" },
  saveButtonText: { color: "white", fontWeight: "500" },
  list: { paddingHorizontal: 8 },
  listItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#f1f3f4" },
  listItemContent: { flex: 1, flexDirection: "row", alignItems: "center" },
  listItemIcon: { marginRight: 12 },
  listItemText: { flex: 1 },
  listItemTitle: { fontSize: 16, color: "#202124", marginBottom: 2 },
  listItemSubtitle: { fontSize: 14, color: "#5f6368" },
  listItemActions: { flexDirection: "row" },
  actionButton: { padding: 8, marginLeft: 4 },
  emptyState: { padding: 40, alignItems: "center", justifyContent: "center" },
  emptyStateText: { fontSize: 16, color: "#5f6368", marginTop: 16, marginBottom: 8 },
  emptyStateSubtext: { fontSize: 14, color: "#9aa0a6", textAlign: "center" },
});

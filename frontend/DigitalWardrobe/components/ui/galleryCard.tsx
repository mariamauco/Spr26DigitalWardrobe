import React, { useRef, useState, useEffect, DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_IMG_SRC_TYPES, DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES } from "react";
import { ScrollView } from "react-native";
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import example from "../../utils/dailyOutfitExample.json"

type Props = {
  width?: number;
  height?: number;
};

const GalleryCarousel: React.FC<Props> = ({ width = 500, height = 400 }) => {  
  const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

  const [loading, setLoading] = useState(true);

  // OUTFIT VARIABLES
  // the types of clothing items we have
  type clothingLabel = "top" | "bottom" | "one_piece" | "outerwear" | "shoe" | "accessory";
  // what makes up an item: id and imagePath
  type outfitItem = {
    id: string,
    imagePath: string
  }
  // an outfit is made up of clothing labels and items
  type Outfit = Partial<Record<clothingLabel, outfitItem | null>>; // Partial means some are optional
  // this is how the json we ask the backend looks
  type DailyOutfitsResponse = Record<string, Outfit>; // first, second, third, ...
  // where we'll be storing our outfits for the UI later
  const [DAILY_OUTFITS, setDailyOutfits] = useState<Outfit[]>([]);
  //const [numOfOutfits, setNumOfOutfits] = useState(0);

  // OUTFIT RENDERING
  const cardWidth = width - 80;
  type Box = { x: number; y: number; w: number; h: number; z?: number };
  // percentages so it scales on mobile/web
  const LAYOUTS: Record<2 | 3 | 4 | 5, Box[]> = {
    5: [
      { x: 0.46, y: 0.00, w: 0.48, h: 0.45, z: 2 },
      { x: 0.00, y: 0.01, w: 0.50, h: 0.43, z: 3 },
      { x: 0.24, y: 0.28, w: 0.42, h: 0.44, z: 4 },
      { x: 0.49, y: 0.52, w: 0.45, h: 0.40, z: 5 },
      { x: 0.00, y: 0.45, w: 0.40, h: 0.50, z: 1 },
    ],
    4: [
      { x: 0.45, y: 0.00, w: 0.48, h: 0.45 },
      { x: 0.00, y: 0.01, w: 0.50, h: 0.43 },
      { x: 0.45, y: 0.48, w: 0.45, h: 0.40 },
      { x: 0.05, y: 0.50, w: 0.42, h: 0.44 },
    ],
    3: [
      { x: 0.02, y: 0.05, w: 0.46, h: 0.45 },
      { x: 0.52, y: 0.10, w: 0.44, h: 0.42 },
      { x: 0.22, y: 0.50, w: 0.56, h: 0.45 },
    ],
    2: [
      { x: 0.04, y: 0.10, w: 0.44, h: 0.78 },
      { x: 0.52, y: 0.10, w: 0.44, h: 0.78 },
    ],
  };
  const ORDER: clothingLabel[] = ["top", "one_piece", "bottom", "outerwear", "shoe", "accessory"];

  // setting for testing with example
  const [dev, setDev] = useState(1); // 1 for dev

  // 1. GET OUTFIT
  useEffect(() => {
    
    // dummy outfits
    let outfitData: DailyOutfitsResponse = example as DailyOutfitsResponse;

    console.log(outfitData)
    
    // make api call to get daily outfit
    const fetchOutfits = async () => {
      try {
        const response = await fetch(`${API_URL}/api/weather/daily-outfit`);
        console.log(response)

        if (!response.ok) {
          throw new Error("Failed to fetch outfits");
        }

        outfitData = await response.json();
      } catch (error) {
        console.error("API error:", error);
      } 
    };

    // storing response into data. much easier due to our variables
    const processData = (raw: DailyOutfitsResponse) => {
      const outfitsList = Object.values(raw); // [first outfit, second outfit, third outfit]
      setDailyOutfits(outfitsList);
    }
    const run = async () => {
      if(!dev){ // call the api if not in dev mode
        await fetchOutfits();
    }
      processData(outfitData);
      //setNumOfOutfits(DAILY_OUTFITS.length)
      setLoading(false); // finished loading data
    }

    run();    
  }, [API_URL, dev]);


  // RENDER OUTFITS 
  function getRenderableItems(outfit: Outfit) {
  return ORDER
    .map((k) => outfit[k])
    .filter((it): it is outfitItem => !!it && !!it.id && !!it.imagePath);
  }

  const flatListRef = useRef<FlatList<Outfit>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    const total = DAILY_OUTFITS.length;

    const nextIndex = (currentIndex + 1) % total; // wraps around
    flatListRef.current?.scrollToOffset({ offset: nextIndex * cardWidth, animated: true, });
    setCurrentIndex(nextIndex);
  };

  const goToPrev = () => {
    const total = DAILY_OUTFITS.length;

    const prevIndex = (currentIndex - 1 + total) % total; // wraps around
    flatListRef.current?.scrollToOffset({ offset: prevIndex * cardWidth, animated: true, });
    setCurrentIndex(prevIndex);
  };

  if (loading) return <Text>Loading...</Text>;
  if (DAILY_OUTFITS.length === 0) return <Text>No outfits found</Text>;

  return (
    <View style={[styles.wrapper, { width, height }]}>
      {/*when LEFT ARROW pressed to previous */}
    <TouchableOpacity style={styles.sideArrow} onPress={goToPrev}>
      <Text style={styles.arrowText}>‹</Text>
    </TouchableOpacity>

      {/* CAROUSEL */}
      <View style={[styles.card, { flex: 1, height }]}>
        <FlatList
          ref={flatListRef} // get current outfit
          data={DAILY_OUTFITS}
          getItemLayout={(_, index) => ({
            length: cardWidth,
            offset: cardWidth * index,
            index,
            })}
          horizontal
          pagingEnabled
          keyExtractor={(_, i) => i.toString()}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {            
            const index = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
            setCurrentIndex(index);
          }}
          renderItem={({ item: outfit }) => {
            const items = getRenderableItems(outfit);
            const count = Math.max(2, Math.min(5, items.length)) as 2 | 3 | 4 | 5;
            const boxes = LAYOUTS[count];

            return (
              <View style={{ width: width - 80, height, position: "relative"}}>
                {items.slice(0, 5).map((it, i) => {
                  const b = boxes[i];
                  return (
                    <Image
                      key={it.id}
                      source={{ uri: `${API_URL}${it.imagePath}` }} // create full uri
                      style={{
                        position: "absolute",
                        left: b.x * (width - 80),
                        top: b.y * height,
                        width: b.w * (width - 80),
                        height: b.h * height,
                        zIndex: b.z ?? i,
                        borderRadius: 10,
                      }}
                      resizeMode="contain"
                    />
                  );
                })}
              </View>
            );
          }}
        />
      </View>

      {/*when RIGHT ARROW pressed to to previous */}
      
      <TouchableOpacity style={styles.sideArrow} onPress={goToNext}>
        <Text style={styles.arrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GalleryCarousel;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  slide: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    gap: 20,
  },
  sideArrow: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: 50,
    color: "#8A5F5F",
    fontWeight: "bold",
  },
});
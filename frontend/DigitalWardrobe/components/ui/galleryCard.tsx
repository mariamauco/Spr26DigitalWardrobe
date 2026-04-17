import React, { useRef, useState, useEffect } from "react";
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

type Props = {
  width?: number;
  height?: number;
};

type ImageItem = {
  id: string;
  uri: string;
};

const GalleryCarousel: React.FC<Props> = ({ width = 200, height = 400 }) => {
  const [slides, setSlides] = useState<ImageItem[][]>([]);
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(1);

  const effectiveWidth = width;

  useEffect(() => {
    // make api call to get daily outfit
    /*
    Example JSON file:
      {
        "first": {
            "top": ["ID", “imagePath”],
            "bottom": ["ID", “imagePath”],
            "accessories": null,
            "footwear": ["ID", “imagePath”],
            "outerwear": ["ID", “imagePath”],
            }, 
        "second": {
            "top": ["ID", “imagePath”],
            "bottom": ["ID", “imagePath”],
            "accessories": null,
            "footwear": ["ID", “imagePath”],
            "outerwear": ["ID", “imagePath”],
            }, 
        "third": {
            "top": "ID",
            "bottom": "ID",
            "accessories": null,
            "footwear": "ID",
            "outerwear": "ID"
            }
      }

    */
    const fetchOutfits = async () => {
      try {
        /*const response = await fetch(
          "http://138.197.16.179:5050/api/weather/daily-outfit"
        );*/
        const response = {
          "first": {
              "top": ["69cc08029451dee96ce52eb1D", "/uploads/u_69a4fc64c6c8150a122826d8_1774979070368_76017578.jpg"],
              "bottom": ["69cb41f6d06d79e87efc5569", "/uploads/u_69a4fc64c6c8150a122826d8_1774928361626_290440119.jpg"],
              "accessories": null,
              "footwear": ["69cc24779451dee96ce52ed8", "/uploads/u_69a4fc64c6c8150a122826d8_1774986355817_792189507.jpg"],
              "outerwear": null,
              }, 
          "second": {
              "top": ["69c974310c62892406315c0e", "/uploads/u_69a4fc64c6c8150a122826d8_1774810160882_298184207.png"],
              "bottom": ["69cb41f6d06d79e87efc5569", "/uploads/u_69a4fc64c6c8150a122826d8_1774928361626_290440119.jpg"],
              "accessories": null,
              "footwear": ["69cc24779451dee96ce52ed8", "/uploads/u_69a4fc64c6c8150a122826d8_1774986355817_792189507.jpg"],
              "outerwear": null,
              },
          "third": {
              "top": ["69cc08029451dee96ce52eb1D", "/uploads/u_69a4fc64c6c8150a122826d8_1774979070368_76017578.jpg"],
              "bottom": ["69cb41f6d06d79e87efc5569", "/uploads/u_69a4fc64c6c8150a122826d8_1774928361626_290440119.jpg"],
              "accessories": null,
              "footwear": ["69cc24779451dee96ce52ed8", "/uploads/u_69a4fc64c6c8150a122826d8_1774986355817_792189507.jpg"],
              "outerwear": ["69cb420bd06d79e87efc556b","/uploads/u_69a4fc64c6c8150a122826d8_1774928391367_850166138.jpg"],
              },
        };

        /*
        if (!response.ok) {
          throw new Error("Failed to fetch outfits");
        }

        const data = await response.json();
        */
       
        // Transform API data → slides
        const formattedSlides: ImageItem[][] = Object.entries(response).map(
          ([outfitKey, outfitValue]) => {
                return Object.entries(outfitValue)
              // 1. Remove nulls and ensure we have an array with the image path
              .filter(([_, item]) => Array.isArray(item) && item.length > 1)
              .map(([category, itemData], itemIndex) => {
                if (!Array.isArray(itemData) || !itemData[1]) return null;

                return {
                  id: `${outfitKey}-${category}-${itemIndex}`,
                  uri: `http://138.197.16.179:5050${itemData[1]}`,
                };
              })
              .filter((item): item is ImageItem => item !== null);
            }
        );

        console.log("formattedSlides:", formattedSlides);
        setSlides(formattedSlides);
      } catch (error) {
        console.error("API error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOutfits();
  }, []);

  if (loading) return <Text>Loading...</Text>;
  if (slides.length === 0) return <Text>No outfits found</Text>;

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / effectiveWidth
    );

    // If at end → jump to start
      if (index === slides.length) {
        flatListRef.current?.scrollToIndex({
          index: 0,
          animated: false,
        });
        setCurrentIndex(0);
      } else {
        setCurrentIndex(index);
      }
  };

  // goes to next outfit
  const goToNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < slides.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex); // Update state manually for button clicks
    } else {
      // Loop back to start
      flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      setCurrentIndex(0);
    }
  };

  // goes to previous outfit
  const goToPrev = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
    } else {
      // Loop to end
      flatListRef.current?.scrollToIndex({ index: slides.length - 1, animated: true });
      setCurrentIndex(slides.length - 1);
    }
  };

  return (
    <View style={[styles.wrapper, { width, height }]}>
      {/*when LEFT ARROW pressed to previous */}
    <TouchableOpacity style={styles.sideArrow} onPress={goToPrev}>
      <Text style={styles.arrowText}>‹</Text>
    </TouchableOpacity>

      {/* CAROUSEL */}
      <View style={[styles.card, { flex: 1, height }]}>
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => i.toString()}
          onMomentumScrollEnd={handleMomentumEnd}

          getItemLayout={(_, index) => ({
            length: width - 80, // Adjust based on your arrow widths
            offset: (width - 80) * index,
            index,
          })}
          
          renderItem={({ item }) => (
            /* Ensure the slide width matches the FlatList container width */
            <View style={{ width: width - 80, alignItems: 'center' }}>
              <ScrollView
                contentContainerStyle={{
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 10,
                }}
                showsVerticalScrollIndicator={false}
              >
                {item?.map((img: ImageItem) => (
                  <Image
                    key={img.id}
                    source={{ uri: img.uri }}
                    style={{
                      width: width - 120, 
                      height: 120,
                      borderRadius: 8,
                    }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              </View>
            )}
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
    backgroundColor: "#fff",
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
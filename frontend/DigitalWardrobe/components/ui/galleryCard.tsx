import React, { useRef, useState, useEffect } from "react";
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

  const effectiveWidth = width - 80;

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
        const response = await fetch(
          "https://api.digitalwardrobe.xyz/api/weather/daily-outfit"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch outfits");
        }

        const data = await response.json();

        // Transform API data → slides
        const formattedSlides: ImageItem[][] = Object.values(data).map(
          (outfit: any, outfitIndex: number) => {
            return Object.values(outfit)
              .filter((item: any) => item !== null)
              .map((item: any, itemIndex: number) => ({
                id: `${outfitIndex}-${itemIndex}`,
                uri: item[1],
              }));
          }
        );

        if (formattedSlides.length === 0) return;

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

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / effectiveWidth
    );

    // If at end → jump to start
      if (index === slides.length - 1) {
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
    const index = Math.round(scrollX.current / effectiveWidth);

    if (index === slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: 0,
        animated: false,
      });
    } else {
      flatListRef.current?.scrollToIndex({
        index: index + 1,
        animated: true,
      });
    }
  };

  // goes to previous outfit
  const goToPrev = () => {
    const index = Math.round(scrollX.current / effectiveWidth);

    if (index === 0) {
      flatListRef.current?.scrollToIndex({
        index: slides.length - 1,
        animated: false,
      });
    } else {
      flatListRef.current?.scrollToIndex({
        index: index - 1,
        animated: true,
      });
    }
  };

  return (
    <View style={[styles.wrapper, { width, height }]}>
      {/*when LEFT ARROW pressed to to previous */}
      <TouchableOpacity style={styles.sideArrow} onPress={goToPrev}>
        <Text style={styles.arrowText}>‹</Text>
      </TouchableOpacity>

      {/* CAROUSEL */}
      <View style={[styles.card, { width: effectiveWidth, height }]}>
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => i.toString()}
          initialScrollIndex={0}
          getItemLayout={(_, index) => ({
            length: effectiveWidth,
            offset: effectiveWidth * index,
            index,
          })}
          onScroll={(event) => {
            scrollX.current = event.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleMomentumEnd}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width: effectiveWidth }]}>
              {item.map((img: ImageItem) => (
                <Image
                  key={img.id}
                  source={{ uri: img.uri }}
                  style={{
                    width: width - 100,
                    height: (height - 40) / 3,
                    borderRadius: 8,
                  }}
                  resizeMode="cover"
                />
              ))}
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
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
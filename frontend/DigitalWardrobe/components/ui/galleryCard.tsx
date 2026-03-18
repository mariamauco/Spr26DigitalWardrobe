import React, { useRef, useState } from "react";
import { TouchableOpacity, Text } from "react-native";

import {
  View,
  FlatList,
  Image,
  StyleSheet,
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

const images: ImageItem[] = [
  { id: "1", uri: "https://picsum.photos/300/300?1" }, // top
  { id: "2", uri: "https://picsum.photos/300/300?2" }, // bottom
  { id: "3", uri: "https://picsum.photos/300/300?3" }, // shoes

  { id: "4", uri: "https://picsum.photos/300/300?4" }, // top
  { id: "5", uri: "https://picsum.photos/300/300?5" }, // bottom
  { id: "6", uri: "https://picsum.photos/300/300?6" }, // shoes

  { id: "7", uri: "https://picsum.photos/300/300?7" }, // top
  { id: "8", uri: "https://picsum.photos/300/300?8" }, // bottom
  { id: "9", uri: "https://picsum.photos/300/300?9" }, // shoes
];

// Split into slides of 3 images
const chunkImages = (data: ImageItem[], size: number) => {
  const chunks: ImageItem[][] = [];
  for (let i = 0; i < data.length; i += size) {
    chunks.push(data.slice(i, i + size));
  }
  return chunks;
};

const originalSlides = chunkImages(images, 3);

// Clone slides for looping
const slides = [
  originalSlides[originalSlides.length - 1],
  ...originalSlides,
  originalSlides[0],
];

const GalleryCarousel: React.FC<Props> = ({ width = 200 , height = 400}) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(1);
  const effectiveWidth = width - 80;

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / effectiveWidth
    );

    if (index === 0) {
      flatListRef.current?.scrollToIndex({
        index: originalSlides.length,
        animated: false,
      });
      setCurrentIndex(originalSlides.length);
    } else if (index === slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: 1,
        animated: false,
      });
      setCurrentIndex(1);
    } else {
      setCurrentIndex(index);
    }
  };

  const scrollX = useRef(0);

  const goToNext = () => {
    const index = Math.round(scrollX.current / effectiveWidth);

    // 🚨 prevent overflow
    if (index >= slides.length - 1) return;

    flatListRef.current?.scrollToIndex({
        index: index + 1,
        animated: true,
    });
};

const goToPrev = () => {
  const index = Math.round(scrollX.current / width);

  // 🚨 prevent underflow
  if (index <= 0) return;

  flatListRef.current?.scrollToIndex({
    index: index - 1,
    animated: true,
  });
};

  return (
    <View style={[styles.wrapper, { width, height }]}>
    
    {/* ⬅ LEFT ARROW */}
    <TouchableOpacity style={styles.sideArrow} onPress={goToPrev}>
      <Text style={styles.arrowText}>‹</Text>
    </TouchableOpacity>

    {/* 🎯 CAROUSEL */}
    <View style={[styles.card, { width: width - 80, height }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        initialScrollIndex={1}
        getItemLayout={(_, index) => ({
          length: width - 80,
          offset: (width - 80) * index,
          index,
        })}
        onScroll={(event) => {
          scrollX.current = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }: { item: ImageItem[] }) => (
          <View style={[styles.slide, { width: width - 80 }]}>
            {item.map((img: ImageItem) => (
              <Image
                key={img.id}
                source={{ uri: img.uri }}
                style={[
                  styles.image,
                  {
                    width: width - 100,
                    height: (height - 40) / 3,
                  },
                ]}
              />
            ))}
          </View>
        )}
      />
    </View>

    {/* ➡ RIGHT ARROW */}
    <TouchableOpacity style={styles.sideArrow} onPress={goToNext}>
      <Text style={styles.arrowText}>›</Text>
    </TouchableOpacity>
    </View>
  );
};

export default GalleryCarousel;

const styles = StyleSheet.create({
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
  image: {
    borderRadius: 8,
  },
  leftArrow: {
    position: "absolute",
    left: 5,
    top: "50%",
    transform: [{ translateY: -15 }],
    zIndex: 10,
},

rightArrow: {
  position: "absolute",
  right: 5,
  top: "50%",
  transform: [{ translateY: -15 }],
  zIndex: 10,
},

wrapper: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

sideArrow: {
  width: 40,
  alignItems: "center",
  justifyContent: "center",
},

arrowText: {
  fontSize: 50, // 🔥 bigger
  color: "#8A5F5F",
  fontWeight: "bold",
},
});
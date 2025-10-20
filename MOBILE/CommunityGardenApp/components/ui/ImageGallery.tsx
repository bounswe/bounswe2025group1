import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Config';

interface ImageData {
    id?: number;
    image_base64?: string;
    base64?: string;
    uri?: string;
}

interface ImageGalleryProps {
    images: ImageData[];
    coverImage?: ImageData | null;
    showCoverBadge?: boolean;
    maxColumns?: number;
    imageHeight?: number;
    onImagePress?: (image: ImageData, index: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ImageGallery({
    images = [],
    coverImage = null,
    showCoverBadge = true,
    maxColumns = 2,
    imageHeight = 150,
    onImagePress,
}: ImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<{ image: ImageData; index: number } | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({});

    const handleImagePress = (image: ImageData, index: number) => {
        if (onImagePress) {
            onImagePress(image, index);
        } else {
            setSelectedImage({ image, index });
            setModalVisible(true);
        }
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedImage(null);
    };

    const getImageUri = (image: ImageData): string => {
        return image.image_base64 || image.base64 || image.uri || '';
    };

    const isCoverImage = (image: ImageData): boolean => {
        if (!showCoverBadge || !coverImage) return false;

        return Boolean(
            (coverImage.id && image.id && coverImage.id === image.id) ||
            (coverImage.image_base64 && image.image_base64 && coverImage.image_base64 === image.image_base64) ||
            (coverImage.base64 && image.base64 && coverImage.base64 === image.base64)
        );
    };

    if (!images || images.length === 0) {
        return (
            <View style={[styles.emptyContainer, { height: imageHeight }]}>
                <Ionicons name="image-outline" size={48} color={COLORS.secondary} />
                <Text style={styles.emptyText}>No images available</Text>
            </View>
        );
    }

    const imageWidth = (screenWidth - 48 - (maxColumns - 1) * 12) / maxColumns; // 48 = padding, 12 = gap

    return (
        <>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.grid}>
                    {images.map((image, index) => {
                        const imageUri = getImageUri(image);
                        const isCover = isCoverImage(image);

                        return (
                            <TouchableOpacity
                                key={image.id || index}
                                style={[
                                    styles.imageContainer,
                                    {
                                        width: imageWidth,
                                        height: imageHeight,
                                        marginRight: (index + 1) % maxColumns === 0 ? 0 : 12,
                                    },
                                ]}
                                onPress={() => handleImagePress(image, index)}
                                activeOpacity={0.8}
                            >
                                <Image
                                    source={{ uri: imageUri }}
                                    style={styles.image}
                                    onLoadStart={() => setImageLoading(prev => ({ ...prev, [index]: true }))}
                                    onLoad={() => setImageLoading(prev => ({ ...prev, [index]: false }))}
                                    onError={() => setImageLoading(prev => ({ ...prev, [index]: false }))}
                                />

                                {/* Loading Indicator */}
                                {imageLoading[index] && (
                                    <View style={styles.loadingOverlay}>
                                        <ActivityIndicator size="small" color={COLORS.white} />
                                    </View>
                                )}

                                {/* Cover Badge */}
                                {isCover && (
                                    <View style={styles.coverBadge}>
                                        <Text style={styles.coverBadgeText}>Cover</Text>
                                    </View>
                                )}

                                {/* Expand Icon */}
                                <View style={styles.expandIcon}>
                                    <Ionicons name="expand-outline" size={20} color={COLORS.white} />
                                </View>

                                {/* Hover Overlay */}
                                <View style={styles.overlay} />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Full Screen Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.modalBackground} onPress={closeModal} />

                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                            <Ionicons name="close" size={24} color={COLORS.white} />
                        </TouchableOpacity>

                        {selectedImage && (
                            <>
                                <Image
                                    source={{ uri: getImageUri(selectedImage.image) }}
                                    style={styles.modalImage}
                                    resizeMode="contain"
                                />

                                {/* Image Info */}
                                <View style={styles.imageInfo}>
                                    <Text style={styles.imageIndex}>
                                        {selectedImage.index + 1} of {images.length}
                                    </Text>
                                    {isCoverImage(selectedImage.image) && (
                                        <View style={styles.modalCoverBadge}>
                                            <Text style={styles.modalCoverBadgeText}>Cover Image</Text>
                                        </View>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
    },
    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        backgroundColor: COLORS.background,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: COLORS.success,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    coverBadgeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    expandIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 6,
        borderRadius: 16,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        margin: 16,
        borderWidth: 2,
        borderColor: COLORS.secondary,
        borderStyle: 'dashed',
    },
    emptyText: {
        color: COLORS.text,
        fontSize: 14,
        marginTop: 8,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        width: '95%',
        height: '90%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 8,
        borderRadius: 20,
    },
    modalImage: {
        width: '100%',
        height: '80%',
    },
    imageInfo: {
        position: 'absolute',
        bottom: 20,
        alignItems: 'center',
    },
    imageIndex: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    modalCoverBadge: {
        backgroundColor: COLORS.success,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    modalCoverBadgeText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
});
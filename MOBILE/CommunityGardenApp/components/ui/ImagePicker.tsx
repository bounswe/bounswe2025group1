import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Config';

interface ImagePickerProps {
    onImagesChange: (images: ImageData[]) => void;
    maxImages?: number;
    initialImages?: ImageData[];
    label?: string;
    allowMultiple?: boolean;
}

interface ImageData {
    base64: string;
    uri: string;
    mimeType: string;
    fileName: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ImagePicker({
    onImagesChange,
    maxImages = 5,
    initialImages = [],
    label = 'Upload Images',
    allowMultiple = true,
}: ImagePickerProps) {
    const [images, setImages] = useState<ImageData[]>(initialImages);
    const [loading, setLoading] = useState(false);

    const validateImage = (imageInfo: any): string | null => {
        // Check file size
        if (imageInfo.fileSize && imageInfo.fileSize > MAX_FILE_SIZE) {
            return 'File size must be less than 5MB';
        }

        // Check file type (basic validation)
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (imageInfo.mimeType && !allowedTypes.includes(imageInfo.mimeType)) {
            return 'Only JPEG, PNG, and WebP images are allowed';
        }

        return null;
    };

    const convertToBase64 = async (uri: string): Promise<string> => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    } else {
                        reject(new Error('Failed to convert to base64'));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            throw new Error('Failed to convert image to base64');
        }
    };

    const pickImage = async (fromCamera: boolean = false) => {
        console.log(`pickImage called with fromCamera: ${fromCamera}`); // Debug log

        if (!allowMultiple && images.length >= 1) {
            console.log('Single image limit reached');
            return;
        }

        if (images.length >= maxImages) {
            console.log(`Max images limit reached: ${maxImages}`);
            return;
        }

        try {
            setLoading(true);
            console.log('Starting image picker process...'); // Debug log

            // Request permissions with more detailed logging
            if (fromCamera) {
                console.log('Requesting camera permissions...'); // Debug log
                const permissionResult = await ImagePickerExpo.requestCameraPermissionsAsync();
                console.log('Camera permission result:', permissionResult); // Debug log
                if (permissionResult.status !== 'granted') {
                    console.log('Camera permission denied');
                    setLoading(false);
                    return;
                }
            } else {
                console.log('Requesting media library permissions...'); // Debug log
                const permissionResult = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
                console.log('Media library permission result:', permissionResult); // Debug log
                if (permissionResult.status !== 'granted') {
                    console.log('Media library permission denied');
                    setLoading(false);
                    return;
                }
            }

            console.log('Permissions granted, launching image picker...'); // Debug log

            const result = fromCamera
                ? await ImagePickerExpo.launchCameraAsync({
                    mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                    base64: true,
                })
                : await ImagePickerExpo.launchImageLibraryAsync({
                    mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                    base64: true,
                    allowsMultipleSelection: false, // Temporarily disable multiple selection
                });

            console.log('Image picker result:', result); // Debug log

            if (result.canceled) {
                console.log('Image picker was canceled');
                return;
            }

            const selectedImages = result.assets || [];
            console.log('Selected images count:', selectedImages.length); // Debug log

            const newImages: ImageData[] = [];

            for (const asset of selectedImages) {
                console.log('Processing asset:', asset.uri); // Debug log

                // Validate the image
                const validationError = validateImage(asset);
                if (validationError) {
                    console.log('Validation error:', validationError);
                    continue;
                }

                // Check if we're at the limit
                if (images.length + newImages.length >= maxImages) {
                    console.log('Image limit reached during processing');
                    break;
                }

                try {
                    const base64 = asset.base64
                        ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
                        : await convertToBase64(asset.uri);

                    const imageData: ImageData = {
                        base64,
                        uri: asset.uri,
                        mimeType: asset.mimeType || 'image/jpeg',
                        fileName: asset.fileName || `image_${Date.now()}.jpg`,
                    };

                    newImages.push(imageData);
                    console.log('Successfully processed image:', imageData.fileName);
                } catch (error) {
                    console.error('Error processing image:', error);
                }
            }

            if (newImages.length > 0) {
                const updatedImages = [...images, ...newImages];
                setImages(updatedImages);
                onImagesChange(updatedImages);
                console.log('Images updated, total count:', updatedImages.length);
            } else {
                console.log('No new images to add');
            }
        } catch (error) {
            console.error('Error picking image:', error);
        } finally {
            setLoading(false);
            console.log('Image picker process completed');
        }
    };

    const removeImage = (index: number) => {
        const updatedImages = images.filter((_, i) => i !== index);
        setImages(updatedImages);
        onImagesChange(updatedImages);
    };

    const showImageOptions = () => {
        console.log('showImageOptions called'); // Debug log

        // For now, let's just go directly to photo library to test
        console.log('Going directly to photo library for testing');
        pickImage(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            {/* Upload Button */}
            <TouchableOpacity
                style={[
                    styles.uploadButton,
                    loading && styles.uploadButtonDisabled,
                ]}
                onPress={() => {
                    console.log('Upload button pressed - calling showImageOptions'); // Debug log
                    showImageOptions();
                }}
                disabled={loading || (!allowMultiple && images.length >= 1) || images.length >= maxImages}
            >
                {loading ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                    <>
                        <Ionicons name="camera" size={24} color={COLORS.white} />
                        <Text style={styles.uploadButtonText}>
                            {images.length === 0
                                ? 'Add Images'
                                : `Add More (${images.length}/${maxImages})`
                            }
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Image Preview */}
            {images.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.imageScrollView}
                    contentContainerStyle={styles.imageScrollContent}
                >
                    {images.map((image, index) => (
                        <View key={index} style={styles.imageContainer}>
                            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removeImage(index)}
                            >
                                <Ionicons name="close-circle" size={24} color={COLORS.error} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Help Text */}
            <Text style={styles.helpText}>
                {allowMultiple
                    ? `You can upload up to ${maxImages} images. Max size: 5MB each.`
                    : 'Upload one image. Max size: 5MB.'
                }
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primaryDark,
        marginBottom: 8,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    uploadButtonDisabled: {
        backgroundColor: COLORS.secondary,
    },
    uploadButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    imageScrollView: {
        marginVertical: 8,
    },
    imageScrollContent: {
        paddingHorizontal: 4,
    },
    imageContainer: {
        position: 'relative',
        marginRight: 12,
    },
    imagePreview: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: COLORS.background,
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: COLORS.white,
        borderRadius: 12,
    },
    helpText: {
        fontSize: 12,
        color: COLORS.text,
        textAlign: 'center',
        marginTop: 4,
    },
});
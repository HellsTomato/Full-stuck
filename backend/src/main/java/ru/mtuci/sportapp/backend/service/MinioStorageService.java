package ru.mtuci.sportapp.backend.service;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.GetObjectResponse;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.errors.ErrorResponseException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MinioStorageService {

    private final MinioClient minioClient;

    @Value("${app.minio.bucket}")
    private String bucket;

    @PostConstruct
    public void ensureBucketExists() {
        // Бакет создается при старте, чтобы загрузка работала без ручной инициализации.
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucket).build()
            );
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize MinIO bucket", e);
        }
    }

    public void upload(String objectName, byte[] content, String contentType) throws Exception {
        // objectName — это ключ объекта, который сохраняем в БД как photoUrl.
        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .stream(new ByteArrayInputStream(content), content.length, -1)
                        .contentType(contentType)
                        .build()
        );
    }

    public Optional<StoredObject> get(String objectName) {
        // Читаем байты и content-type, чтобы вернуть изображение через REST.
        try (GetObjectResponse response = minioClient.getObject(
                GetObjectArgs.builder().bucket(bucket).object(objectName).build()
        )) {
            String contentType = response.headers().get("Content-Type");
            if (contentType == null || contentType.isBlank()) {
                contentType = "image/jpeg";
            }
            return Optional.of(new StoredObject(response.readAllBytes(), contentType));
        } catch (ErrorResponseException e) {
            if ("NoSuchKey".equals(e.errorResponse().code())) {
                return Optional.empty();
            }
            throw new IllegalStateException("MinIO read failed", e);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read object from MinIO", e);
        } catch (Exception e) {
            throw new IllegalStateException("MinIO read failed", e);
        }
    }

    public void deleteIfExists(String objectName) {
        // Идемпотентное удаление: отсутствие объекта не считается ошибкой.
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder().bucket(bucket).object(objectName).build()
            );
        } catch (ErrorResponseException e) {
            if ("NoSuchKey".equals(e.errorResponse().code())) {
                return;
            }
            throw new IllegalStateException("MinIO delete failed", e);
        } catch (Exception e) {
            throw new IllegalStateException("MinIO delete failed", e);
        }
    }

    public record StoredObject(byte[] bytes, String contentType) {}
}

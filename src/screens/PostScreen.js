//Cibely, Júlia Fortunato, Luiz Gustavo

import React, { useState, useEffect } from 'react';
import { View, Image, TextInput, Text, ActivityIndicator, Alert, FlatList, TouchableOpacity, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';



export default function PostagemScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    requestPermissions();
    loadPosts();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permissão necessária", "Precisamos da permissão para acessar suas imagens.");
    }
  };

  const loadPosts = async () => {
    try {
      const storedPosts = await AsyncStorage.getItem('posts');
      if (storedPosts) {
        setPosts(JSON.parse(storedPosts));
      }
    } catch (error) {
      console.error('Erro ao carregar postagens:', error);
    }
  };

  const savePosts = async (newPosts) => {
    try {
      await AsyncStorage.setItem('posts', JSON.stringify(newPosts));
    } catch (error) {
      console.error('Erro ao salvar postagens:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert("Erro", "Selecione uma imagem primeiro.");
      return;
    }

    setUploading(true);
    const response = await fetch(image);
    const blob = await response.blob();

    const filename = `imagens/${Date.now()}.jpg`;

    const params = {
      Key: filename,
      Bucket: bucket,
      Body: blob,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    };

    s3.upload(params, (err, data) => {
      setUploading(false);
      if (err) {
        Alert.alert("Erro ao fazer upload", "Verifique a conexão ou permissões do S3.");
        console.log(err);
      } else {
        console.log('Imagem enviada. URL:', data.Location);
        Alert.alert("Upload feito com sucesso!");
        createPost(data.Location);
      }
    });
  };

  const createPost = (imageUrl) => {
    console.log('Criando post com imagem:', imageUrl);

    const newPost = {
      id: Date.now().toString(),
      userName: userName || 'Usuário Anônimo',
      text: text,
      imageUrl: imageUrl,
      likes: 0,
      comments: [],
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    savePosts(updatedPosts);
    setImage(null);
    setText('');
  };

  const handleLike = (postId) => {
    const updated = posts.map(post =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    );
    setPosts(updated);
    savePosts(updated);
  };

  const handleComment = (postId, comment) => {
    const updated = posts.map(post =>
      post.id === postId ? { ...post, comments: [...post.comments, comment] } : post
    );
    setPosts(updated);
    savePosts(updated);
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#f5f5f5' }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ padding: 10, backgroundColor: '#ccc', borderRadius: 5, marginBottom: 10 }}
      >
        <Text>Voltar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setMenuVisible(!menuVisible)}
        style={{ padding: 10, backgroundColor: '#ccc', borderRadius: 5, marginBottom: 10 }}
      >
        <Text>{menuVisible ? 'Fechar Menu ▲' : 'Abrir Menu ▼'}</Text>
      </TouchableOpacity>

      {menuVisible && (
        <View style={{ marginBottom: 20 }}>
          <TextInput
            style={{ backgroundColor: '#fff', borderColor: '#ccc', borderWidth: 1, borderRadius: 5, marginBottom: 10, padding: 8 }}
            placeholder="Escreva algo..."
            value={text}
            onChangeText={setText}
          />
          <TextInput
            style={{ backgroundColor: '#fff', borderColor: '#ccc', borderWidth: 1, borderRadius: 5, marginBottom: 10, padding: 8 }}
            placeholder="Seu nome"
            value={userName}
            onChangeText={setUserName}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={pickImage} style={{ backgroundColor: '#ddd', padding: 8, borderRadius: 5 }}>
              <Text>Selecionar Imagem</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={uploadImage} style={{ backgroundColor: '#ffa500', padding: 8, borderRadius: 5 }}>
              <Text>Fazer Upload</Text>
            </TouchableOpacity>
          </View>
          {image && (
            Platform.OS === 'web' ? (
              <img src={image} alt="Preview" style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 5, objectFit: 'cover' }} />
            ) : (
              <Image source={{ uri: image }} style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 5 }} />
            )
          )}
          {uploading && <ActivityIndicator size="large" color="#000" style={{ marginTop: 10 }} />}
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#fff', padding: 10, marginBottom: 15, borderRadius: 5 }}>
            <Text style={{ fontWeight: 'bold' }}>Postado por: {item.userName}</Text>
            {item.imageUrl && (
              Platform.OS === 'web' ? (
                <img src={item.imageUrl} alt="Post" style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 5, objectFit: 'cover' }} />
              ) : (
                <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 5 }} />
              )
            )}
            <Text style={{ marginVertical: 10 }}>{item.text}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => handleLike(item.id)} style={{ padding: 6, backgroundColor: '#e0e0e0', borderRadius: 5 }}>
                <Text>Curtir ({item.likes})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const comment = prompt("Digite seu comentário:");
                  if (comment) handleComment(item.id, comment);
                }}
                style={{ padding: 6, backgroundColor: '#e0e0e0', borderRadius: 5 }}
              >
                <Text>Comentar</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={item.comments}
              keyExtractor={(index) => index.toString()}
              renderItem={({ item: comment }) => (
                <Text style={{ marginTop: 5, color: '#555' }}>• {comment}</Text>
              )}
            />
          </View>
        )}
      />
    </View>
  );
}
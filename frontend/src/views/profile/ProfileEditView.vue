<script lang="ts" setup>
import { ref, onBeforeMount } from "vue";
import { useRouter, useRoute } from "vue-router";

import { useAuthStore } from "../../store/useAuthStore";
import { updateUser, getUserById } from "../../services/users";
import { useToast } from "vue-toast-notification";
import { type UserUpdateData } from "../../services/types";

const API_URL = import.meta.env.VITE_API_URL

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast()

const route = useRoute();

const user = ref({
    firstName: authStore.user?.firstName || "",
    lastName: authStore.user?.lastName || "",
    email: authStore.user?.email || "",
    avatar: authStore.user?.avatar ? API_URL + "/" + authStore.user.avatar : "https://via.placeholder.com/150",
    role: authStore.user?.role || "user",
    permissions: (authStore.user?.permissions || []).reduce((acc, permission) => {
        acc[permission] = true;
        return acc;
    }, {})
});

const isAdmin = user.value.role === "admin";
const isModerator = user.value.role === "moderator";
const isUser = user.value.role === "user";

const avatarInput = ref < HTMLInputElement | null > (null);
const avatarFile = ref<File | null>(null);
const isLoading = ref(false);

const handleAvatarChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        const file = target.files[0];
        avatarFile.value = file;
        user.value.avatar = URL.createObjectURL(file);
    }
}

const handleSubmit = () => {
    const formData = new FormData();
    formData.append("firstName", user.value.firstName);
    formData.append("lastName", user.value.lastName);

    if (avatarFile.value) {
        formData.append("avatar", avatarFile.value);
    }

    if (isModerator || isAdmin) {
        const permissions = user.value.permissions;
        formData.append("permissions", Object.keys(permissions).filter((key) => permissions[key]).join(','));
        formData.append("email", user.value.email);
    }

    if (isAdmin) {
        formData.append("role", user.value.role);
    }

    isLoading.value = true;
    const userId = route.params.id as string;

    updateUser(userId || authStore.user?._id, formData as unknown as UserUpdateData).then((res) => {
        if (!userId) {
            authStore.updateUser(res.data);
        }

        toast.success("Profile updated successfully.");
        router.back()
    }).finally(() => isLoading.value = false)
}; 

onBeforeMount(() => {
    if (route.params.id) {
        const userId = route.params.id as string;

        if (authStore.user.role === 'moderate' && !authStore.user.permissions.includes('edit')) {
            router.push({ name: 'profile' })
            return
        }

        getUserById(userId).then((res) => {
            user.value = {
                firstName: res.data.firstName,
                lastName: res.data.lastName,
                email: res.data.email,
                avatar: res.data.avatar ? API_URL + "/" + res.data.avatar : "https://via.placeholder.com/150",
                role: res.data.role,
                permissions: (res.data.permissions || []).reduce((acc, permission) => {
                    acc[permission] = true;
                    return acc;
                }, {})
            }
        })
    }
})
</script>

<template>
    <div class="min-h-screen bg-gray-100 flex justify-center items-center px-4 sm:px-6 md:px-8">
        <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl sm:w-96">
            <h2 class="text-2xl font-semibold mb-6">Edit Profile</h2>
            <form @submit.prevent="handleSubmit">
                <input type="file" accept="image/*" ref="avatarInput" style="display: none"
                    @change="handleAvatarChange" />
                <div class="flex justify-center mb-6">
                    <div class="relative">
                        <img class="w-24 h-24 rounded-full object-cover" :src="user.avatar" alt="User Avatar" />
                        <button type="button" @click="avatarInput!.click()"
                            class="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600">
                            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 11H5m7 7h7m-7-7V5m0 7v7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="mb-4">
                    <label for="firstname" class="block text-sm font-medium text-gray-700">First Name</label>
                    <input type="text" id="firstname" v-model="user.firstName"
                        class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John" />
                </div>

                <div class="mb-4">
                    <label for="lastname" class="block text-sm font-medium text-gray-700">Last Name</label>
                    <input type="text" id="lastname" v-model="user.lastName"
                        class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Doe" />
                </div>

                <div class="mb-4" v-if="isAdmin || isModerator" >
                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" id="email" v-model="user.email" :readonly="isAdmin"
                        class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="example@email.com" />
                </div>

                <div v-if="isAdmin" class="mb-4">
                    <label for="role" class="block text-sm font-medium text-gray-700">Role</label>
                    <select v-model="user.role" id="role"
                        class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="moderator"> Moderator </option>
                    </select>
                </div>

                <div v-if="isAdmin && user.role === 'moderator'" class="mb-4">
                    <label for="role" class="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <div class="flex items-center">
                            <input type="checkbox" id="read" v-model="user.permissions.read" value="read"
                                class="mr-2">
                            <label for="read">Read</label>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="update" v-model="user.permissions.update" value="update"
                                class="mr-2">
                            <label for="edit">Update</label>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="delete" v-model="user.permissions.delete" value="delete"
                                class="mr-2">
                            <label for="delete">Delete</label>
                        </div>
                    </div>
                </div>


                <div class="mt-4">
                    <button type="submit"
                        :classs="{ 'opacity-50 cursor-not-allowed': isLoading }"
                        class="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Save
                        Changes</button>
                </div>
            </form>
        </div>
    </div>
</template>

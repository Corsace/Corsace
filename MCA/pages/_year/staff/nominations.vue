<template>
    <div class="staff-page">
        <mode-switcher
            hide-phase
            title="nominations"
        >
            <div class="staff-filters">
                <search-bar
                    class="category-filters"
                    :placeholder="$t('mca.nom_vote.search')"
                    @update:search="text = $event"
                >
                    <toggle-button
                        :options="viewOptions"
                        @change="changeView"
                    />
                    <button
                        v-if="!showReviewed && viewOption !== 'invalid'"
                        @click="showReviewed = true"
                        class="button"
                    >
                        Show Reviewed
                    </button>
                    <button
                        v-else-if="showReviewed && viewOption !== 'invalid'"
                        @click="showReviewed = false"
                        class="button"
                    >
                        Hide Reviewed
                    </button>
                </search-bar>
            </div>
            <div class="staff-container staff-searchContainer">
                <div class="staff-container staff-scrollTrack">
                    <template
                        v-for="category in relatedCategories"
                    >
                        <div
                            :key="category.id + '-cat-header'"
                            @click.prevent="selectCategory(category.id)"
                            class="staff-container__header"
                            :class="{ 'staff-container__header--active': category.id === selectedCategoryId }"
                        >
                            <a
                                class="staff-container__title"
                                href="#"
                                @click.prevent
                            >
                                {{ $t(`mca.categories.${category.name}.name`) }}
                            </a>
                            <span>{{ category.type }}</span>
                        </div>
                        <div
                            v-if="category.id === selectedCategoryId"
                            :key="category.id + '-category'"
                            class="staff-container__box"
                        >
                            <div
                                v-for="userNominations in selectedCategoryInfo"
                                :key="userNominations.nominator.osuID + '-nominator'"
                                class="staff-nomination-container"
                            >
                                <span class="staff-user">
                                    <a
                                        :href="`https://osu.ppy.sh/users/${userNominations.nominator.osuID}`"
                                        target="_blank"
                                        class="staff-user__link"
                                    >
                                        {{ userNominations.nominator.osuUsername }}
                                    </a>
                                    <a
                                        :href="`https://osu.ppy.sh/users/${userNominations.nominator.osuID}`"
                                        target="_blank"
                                    >
                                        <img
                                            :src="`https://a.ppy.sh/${userNominations.nominator.osuID}`"
                                            class="staff-user__avatar"
                                        >
                                    </a>
                                </span>

                                <ul class="staff-list">
                                    <li
                                        v-for="nomination in userNominations.nominations"
                                        :key="nomination.ID + '-nomination'"
                                    >
                                        <div class="staff-nomination">
                                            <div class="staff-nomination__info">
                                                <div 
                                                    class="staff-page__banner"
                                                    :style="getBanner(nomination)"
                                                />
                                                <a
                                                    class="staff-page__subject"
                                                    :href="generateUrl(nomination)"
                                                    target="_blank"
                                                >
                                                    {{ getNomineeName(nomination) }}
                                                </a>
                                                <div>
                                                    <a
                                                        v-if="nomination.beatmapset && nomination.beatmapset.ID"
                                                        class="staff-page__small"
                                                        :href="generateUrl(nomination)"
                                                        target="_blank"
                                                    >
                                                        {{ getSpecs(nomination) }}
                                                    </a>
                                                    <span
                                                        class="staff-nomination__status"
                                                        :class="`staff-nomination__status--${nomination.isValid ? 'valid' : 'invalid'}`"
                                                    >
                                                        {{ nomination.isValid ? 'valid' : 'invalid' }}
                                                    </span>
                                                </div>
                                                <div 
                                                    v-if="nomination.reviewer"
                                                    class="staff-page__small"
                                                >
                                                    Last reviewed by:
                                                    {{ nomination.reviewer }}
                                                    on {{ new Date(nomination.lastReviewedAt).toString() }}
                                                </div>
                                            </div>

                                            <div class="staff-nomination__actions">
                                                <button
                                                    class="button button--small staff-nomination__action"
                                                    @click="updateNomination(nomination.ID, true)"
                                                >
                                                    accept
                                                </button>
                                                <button
                                                    class="button button--small staff-nomination__action"
                                                    @click="updateNomination(nomination.ID, false)"
                                                >
                                                    reject
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </template>
                </div>
                <scroll-bar
                    @bottom="selectStart === -1 ? null : appendCategory()"
                    selector=".staff-scrollTrack"
                />
            </div>
        </mode-switcher>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace, State } from "vuex-class";

import ModeSwitcher from "../../../../MCA-AYIM/components/ModeSwitcher.vue";
import ScrollBar from "../../../../MCA-AYIM/components/ScrollBar.vue";
import SearchBar from "../../../../MCA-AYIM/components/SearchBar.vue";
import ToggleButton from "../../../../MCA-AYIM/components/ToggleButton.vue";

import { CategoryInfo } from "../../../../Interfaces/category";
import { StaffNomination } from "../../../../Interfaces/nomination";

const staffModule = namespace("staff");

interface UserNomination {
    nominator: {
        osuID: string;
        osuUsername: string;
        discordUsername: string;
    },
    nominations: StaffNomination[]
}

interface NominationsByCategory {
    category: number;
    userNominations: UserNomination[];
}

@Component({
    components: {
        ModeSwitcher,
        ScrollBar,
        SearchBar,
        ToggleButton,
    },
    head () {
        return {
            title: "Nominations | Staff | MCA",
        };
    },
})
export default class Nominations extends Vue {
    
    @State selectedMode!: string;
    @staffModule.State categories!: CategoryInfo[];

    nominations: StaffNomination[] = [];
    viewOptions = ["both", "valid", "invalid"];
    viewOption = "both";
    text = "";
    showReviewed = true;
    selectedCategoryId: null | number = null;
    selectStart: number = 0;

    get relatedCategories (): CategoryInfo[] {
        return this.categories.filter(c => c.mode === this.selectedMode || c.mode === "storyboard");
    }

    get nominationsByCategory (): NominationsByCategory[] {
        const groups: NominationsByCategory[] = [];

        for (const nomination of this.nominations) {
            if (nomination.reviewer && !this.showReviewed) continue;
            
            if (!nomination.isValid && this.viewOption === "valid") continue;
            else if (nomination.isValid && this.viewOption === "invalid") continue;

            if (this.text) {
                const lowerText = this.text.toLowerCase();
                if (nomination.user?.osuID) {
                    if (
                        !nomination.nominator.osuUsername.toLowerCase().includes(lowerText) &&
                        !nomination.nominator.osuID.includes(lowerText) &&
                        !nomination.nominator.discordUsername.includes(lowerText) &&
                        !nomination.user.osuUsername.toLowerCase().includes(lowerText) && 
                        !nomination.user.osuID.includes(lowerText) &&
                        !nomination.user.discordUsername.toLowerCase().includes(lowerText)
                    )
                        continue;
                } else if (nomination.beatmapset?.ID) {
                    if (
                        !nomination.nominator.osuUsername.toLowerCase().includes(lowerText) &&
                        !nomination.nominator.osuID.includes(lowerText) &&
                        !nomination.nominator.discordUsername.includes(lowerText) &&
                        !nomination.beatmapset.ID.toString().includes(lowerText) &&
                        !nomination.beatmapset.artist.toLowerCase().includes(lowerText) &&
                        !nomination.beatmapset.title.toLowerCase().includes(lowerText) &&
                        !nomination.beatmapset.tags.toLowerCase().includes(lowerText) &&
                        !nomination.beatmapset.creator!.osuUsername.toLowerCase().includes(lowerText) && 
                        !nomination.beatmapset.creator!.osuID.includes(lowerText) &&
                        !nomination.beatmapset.creator!.discordUsername.toLowerCase().includes(lowerText)
                    )
                        continue;
                }
            }

            const groupIndex = groups.findIndex(g => g.category === nomination.category);

            if (groupIndex !== -1) {
                const nominatorIndex = groups[groupIndex].userNominations.findIndex(n => n.nominator.osuID === nomination.nominator.osuID);

                if (nominatorIndex !== -1) {
                    groups[groupIndex].userNominations[nominatorIndex].nominations.push(nomination);
                } else {
                    groups[groupIndex].userNominations.push({
                        nominator: nomination.nominator,
                        nominations: [nomination],
                    });
                }
            } else {
                groups.push({
                    category: nomination.category,
                    userNominations: [{
                        nominator: nomination.nominator,
                        nominations: [nomination],
                    }],
                });
            }
        }

        return groups;
    }

    get selectedCategoryInfo (): UserNomination[] {
        const group = this.nominationsByCategory.find(group => group.category === this.selectedCategoryId);
        return group?.userNominations || [];
    }

    async changeView (option: string) {
        this.viewOption = option;
        if (this.viewOption === "invalid")
            this.showReviewed = true;
    }

    async selectCategory (id: number) {
        if (this.selectedCategoryId === id) {
            this.nominations = [];
            this.selectedCategoryId = null;
            return;
        }
        this.selectStart = 0;
        const { data } = await this.$axios.get(`/api/staff/nominations?category=${id}&start=${this.selectStart}`);

        if (data.error) {
            alert(data.error);
            return;
        }

        this.nominations = data.staffNominations;
        this.selectStart = data.nextStart;
        this.selectedCategoryId = id;
    }

    async appendCategory () {
        if (this.selectStart === -1) return;

        const { data } = await this.$axios.get(`/api/staff/nominations?category=${this.selectedCategoryId}&start=${this.selectStart}`);
        if (data.error) {
            alert(data.error);
            return;
        }

        this.nominations.push(...data.staffNominations);
        this.selectStart = data.nextStart;
    }

    generateUrl (nomination: StaffNomination): string {
        if (nomination.beatmapset) {
            return `https://osu.ppy.sh/beatmapsets/${nomination.beatmapset.ID}`;
        }
        
        return `https://osu.ppy.sh/users/${nomination.user?.osuID}`;
    }

    getNomineeName (nomination: StaffNomination) {
        if (nomination.beatmapset) {
            return `${nomination.beatmapset.artist} - ${nomination.beatmapset.title} by ${nomination.beatmapset.creator!.osuUsername}`;
        }

        return `${nomination.user?.osuUsername}`;
    }

    getSpecs (nomination: StaffNomination): string {
        if (!nomination.beatmapset) return "";
        
        const minutes = Math.floor(nomination.beatmapset.length / 60);
        const seconds = nomination.beatmapset.length - minutes * 60;
        let time = `${minutes}:${seconds}`
        if (time.slice(-2, -1) === ":") {
            time =  time.slice(0, -1) + "0" + time.slice(-1);
        }
        return `${nomination.beatmapset.BPM} BPM | ${time} | ${nomination.beatmapset.maxSR.toFixed(2)} ★`;
    }

    getBanner (nomination: StaffNomination) {
        if (nomination.beatmapset) {
            return { "background-image": `url('https://assets.ppy.sh/beatmaps/${nomination.beatmapset.ID}/covers/cover.jpg?1560315422')` };
        } else if (nomination.user) {
            return { "background-image": `url(https://a.ppy.sh/${nomination.user.osuID})` }
        }
        return { "background-image": "" };
    }

    updateLocalNomination (id: number, data) {
        const i = this.nominations.findIndex(n => n.ID === id);
        if (i !== -1) {
            this.nominations[i].reviewer = data.reviewer;
            this.nominations[i].lastReviewedAt = data.lastReviewedAt;
            this.nominations[i].isValid = data.isValid;
        }
    }

    async updateNomination (id: number, isValid) {
        const { data } = await this.$axios.post(`/api/staff/nominations/${id}/update`, {
            isValid,
        });

        if (!data.error) {
            this.updateLocalNomination(id, data);
        } else {
            alert("Hellooo peep console (Ctrl + Shift + I then console tab at top)")
            console.error(data.error);
        }
    }

}
</script>

<style lang="scss">
@use '@s-sass/_partials';
@import '@s-sass/_variables';

.staff-nomination {
    &-container {
        display: flex;
        flex-direction: column;
        margin: 3px 0 10px 0;
        border-bottom: 1px solid white;
    }
    
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;

    min-height: 65px;

    &__status {
        margin-left: 8px;

        &--valid {
            color: $green;
        }

        &--invalid {
            color: $red;
        }
    }

    &__actions {
        display: flex;
    }

    &__action {
        margin: 5px;
    }
}

</style>